import dns from 'node:dns/promises'
import { isIP } from 'node:net'
import type { LookupFunction } from 'node:net'
import ipaddr from 'ipaddr.js'
import { Agent, request } from 'undici'

function isPublic(address: string): boolean {
  try { return ipaddr.process(address).range() === 'unicast' } catch { return false }
}

/** Re-resolve on every call; an endpoint accepted during registration is not trusted forever. */
export async function validateEndpoint(input: string, env: NodeJS.ProcessEnv = process.env) {
  let url: URL
  try { url = new URL(input) } catch { throw new Error('Invalid agent endpoint URL') }
  if (url.username || url.password || url.hash) throw new Error('Endpoint credentials and fragments are forbidden')
  const allow = env.NODE_ENV !== 'production' && (env.EGRESS_DEV_ALLOW || '').split(',').filter(Boolean).some(origin => {
    try { const entry = new URL(origin); return entry.origin === url.origin && !entry.username && !entry.password
      && entry.pathname === '/' && !entry.search && !entry.hash } catch { return false }
  })
  if (!['http:','https:'].includes(url.protocol) || (!allow && (url.protocol !== 'https:' || (url.port && url.port !== '443')))) {
    throw new Error('Agent endpoints require HTTPS on port 443')
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const literal = isIP(hostname)
  const addresses = literal ? [{ address:hostname, family:literal }] : await dns.lookup(hostname, { all:true, verbatim:true })
  if (!addresses.length || (!allow && addresses.some(record => !isPublic(record.address)))) {
    throw new Error('Agent endpoint resolves to a forbidden network')
  }
  return { url, address:addresses[0]!.address, family:addresses[0]!.family }
}

/** Pin the vetted IP, keep hostname/SNI, reject redirects, and bound the whole response. */
export async function safeFetch(input: string, options: {
  method?: 'GET' | 'POST'; headers?: Record<string,string>; body?: string;
  timeoutMs?: number; maxBytes?: number; signal?: AbortSignal
} = {}): Promise<Response> {
  const { timeoutMs = 15_000, maxBytes = 1_048_576 } = options
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || !Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error('Invalid agent request limits')
  }
  const signal = options.signal ? AbortSignal.any([options.signal,AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
  let abort: () => void = () => {}
  const timeout = new Promise<never>((_resolve,reject) => {
    abort = () => reject(new Error('Agent endpoint validation aborted'))
    signal.addEventListener('abort',abort,{ once:true })
    if (signal.aborted) abort()
  })
  let endpoint: Awaited<ReturnType<typeof validateEndpoint>>
  try { endpoint = await Promise.race([validateEndpoint(input),timeout]) }
  finally { signal.removeEventListener('abort',abort) }
  signal.throwIfAborted()
  const lookup: LookupFunction = (_hostname, lookupOptions, callback) => {
    if (lookupOptions.all) callback(null,[{ address:endpoint.address,family:endpoint.family }])
    else callback(null,endpoint.address,endpoint.family)
  }
  const dispatcher = new Agent({ connect:{ lookup }, connections:1 })
  try {
    const response = await request(endpoint.url, { dispatcher, method:options.method || 'GET',
      headers:options.headers, body:options.body, signal,
      // A dedicated Agent has no redirect interceptor; request returns the original 3xx.
      headersTimeout:timeoutMs, bodyTimeout:timeoutMs })
    try {
      if (response.statusCode >= 300 && response.statusCode < 400) throw new Error('Agent redirects are forbidden')
      const contentType = response.headers['content-type']
      if (typeof contentType !== 'string' || !/^application\/(?:json|[\w.-]+\+json)(?:\s*;|$)/i.test(contentType)) {
        throw new Error('Agent response must be JSON')
      }
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of response.body) {
        const buffer = Buffer.from(chunk)
        size += buffer.length
        if (size > maxBytes) throw new Error('Agent response exceeds body limit')
        chunks.push(buffer)
      }
      return new Response(Buffer.concat(chunks), { status:response.statusCode, headers:{'Content-Type':contentType} })
    } finally {
      // Destroying an unread body emits UND_ERR_ABORTED; consume that cleanup event.
      response.body.on('error', () => {}).destroy()
    }
  } finally { await dispatcher.destroy() }
}
