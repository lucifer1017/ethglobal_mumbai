import dns from 'node:dns/promises'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, expect, test, vi } from 'vitest'
import { safeFetch, validateEndpoint } from '../src/utils/egress.js'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

test.each(['http://127.0.0.1','http://[::1]','http://169.254.169.254/latest/meta-data',
  'http://2130706433','https://user:pass@example.com','https://example.com:8443',
  'https://example.com/#fragment','file:///etc/passwd',
  ...['0.1.2.3','10.0.0.1','100.64.0.1','127.1.2.3','169.254.169.254','172.16.0.1',
    '192.168.0.1','198.18.0.1','224.0.0.1','[::]','[::1]','[fc00::1]','[fe80::1]',
    '[::ffff:127.0.0.1]'].map(ip => `https://${ip}`)])('rejects forbidden endpoint %s', async url => {
  vi.stubEnv('EGRESS_DEV_ALLOW','')
  await expect(validateEndpoint(url)).rejects.toThrow()
})

test('all resolved A/AAAA records must be public, and accepted resolution is returned for pinning', async () => {
  const lookup = vi.spyOn(dns,'lookup')
  lookup.mockResolvedValueOnce([{ address:'1.1.1.1',family:4 },{ address:'127.0.0.1',family:4 }] as never)
  await expect(validateEndpoint('https://mixed.example')).rejects.toThrow('forbidden network')
  lookup.mockResolvedValueOnce([{ address:'::ffff:10.0.0.1',family:6 }] as never)
  await expect(validateEndpoint('https://mapped.example')).rejects.toThrow('forbidden network')
  lookup.mockResolvedValueOnce([{ address:'1.1.1.1',family:4 }] as never)
  expect((await validateEndpoint('https://public.example')).address).toBe('1.1.1.1')
})

test('production ignores development origins', async () => {
  await expect(validateEndpoint('http://127.0.0.1:8402', {
    NODE_ENV:'production',EGRESS_DEV_ALLOW:'http://127.0.0.1:8402',
  })).rejects.toThrow('HTTPS')
})

test('vetted lookup is used once; redirects, non-JSON, oversized and slow bodies fail', async () => {
  let redirected = false
  const server = createServer((req,res) => {
    if (req.url === '/redirect') { res.writeHead(302,{ Location:'/internal' });res.end();return }
    if (req.url === '/internal') redirected = true
    if (req.url === '/text') { res.end('not JSON');return }
    res.setHeader('Content-Type','application/json')
    if (req.url === '/large') { res.write(' '.repeat(32));res.end(' '.repeat(32));return }
    if (req.url === '/slow') { res.write('{');return }
    res.end('{"ok":true}')
  })
  await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve))
  const port = (server.address() as AddressInfo).port
  const origin = `http://vetted.example:${port}`
  vi.stubEnv('EGRESS_DEV_ALLOW',origin)
  const lookup = vi.spyOn(dns,'lookup').mockResolvedValue([{ address:'127.0.0.1',family:4 }] as never)
  try {
    const response = await safeFetch(origin)
    expect(await response.json()).toEqual({ok:true})
    // request's socket uses the pinned address rather than a second DNS lookup.
    expect(lookup).toHaveBeenCalledTimes(1)
    await expect(safeFetch(origin+'/redirect')).rejects.toThrow('redirects')
    expect(redirected).toBe(false)
    await expect(safeFetch(origin+'/text')).rejects.toThrow('JSON')
    await expect(safeFetch(origin+'/large',{ maxBytes:16 })).rejects.toThrow('body limit')
    await expect(safeFetch(origin+'/slow',{ timeoutMs:100 })).rejects.toThrow()
  } finally { server.closeAllConnections();await new Promise<void>(resolve => server.close(() => resolve())) }
})

test('DNS validation is included in the total timeout', async () => {
  vi.spyOn(dns,'lookup').mockImplementation(() => new Promise(() => {}) as never)
  await expect(safeFetch('https://slow-dns.example',{timeoutMs:50})).rejects.toThrow('validation aborted')
})

test.skipIf(process.env.METER_EGRESS_LIVE_TEST !== '1')('public HTTPS JSON endpoint succeeds', async () => {
  const response = await safeFetch('https://httpbin.org/json')
  expect(response.ok).toBe(true)
  expect(await response.json()).toHaveProperty('slideshow')
})
