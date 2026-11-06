import { afterEach, expect, test, vi } from 'vitest'
import { generateAgentBlurb } from '../src/utils/summarize.js'

vi.mock('../src/logger.js', () => ({ logger: { warn: vi.fn() } }))
afterEach(() => vi.unstubAllGlobals())

const fallback = { tagline: 'Checks a wallet.', short_description: 'Checks a wallet.' }
const copy = { tagline: 'Wallet checks', short_description: 'A clear wallet summary.' }

function mockResponse(stopReason = 'end_turn', text = JSON.stringify(copy)) {
  const fetch = vi.fn(async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    expect(body.model).toBe('claude-haiku-5-5')
    expect(body.max_tokens).toBe(1024)
    expect(body.output_config).toEqual({ effort: 'low' })
    return Response.json({
      id: 'msg_test', type: 'message', role: 'assistant', model: body.model,
      content: [
        { type: 'thinking', thinking: 'Internal reasoning', signature: 'test' },
        { type: 'text', text },
      ],
      stop_reason: stopReason, stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10 },
    })
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

test('real SDK serialization uses Haiku 5.5 options and reads text after thinking', async () => {
  const fetch = mockResponse()
  expect(await generateAgentBlurb('Check', 'Checks a wallet.', 'test-only')).toEqual(copy)
  expect(fetch).toHaveBeenCalledOnce()
})

test('no API key uses a deterministic fallback without a request', async () => {
  const fetch = mockResponse()
  expect(await generateAgentBlurb('Check', 'Checks a wallet.')).toEqual(fallback)
  expect(fetch).not.toHaveBeenCalled()
})

test('an empty description uses the name without a request', async () => {
  const fetch = mockResponse()
  expect(await generateAgentBlurb('Check', '', 'test-only')).toEqual({ tagline: 'Check', short_description: 'Check' })
  expect(fetch).not.toHaveBeenCalled()
})

test.each(['max_tokens', 'refusal'])('%s discards valid-looking output', async stopReason => {
  mockResponse(stopReason)
  expect(await generateAgentBlurb('Check', 'Checks a wallet.', 'test-only')).toEqual(fallback)
})

test.each(['not-json', '{"tagline":broken}', '{"tagline":17}'])('malformed output %s uses the fallback', async output => {
  mockResponse('end_turn', output)
  expect(await generateAgentBlurb('Check', 'Checks a wallet.', 'test-only')).toEqual(fallback)
})
