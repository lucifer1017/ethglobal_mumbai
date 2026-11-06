import { expect, test } from 'vitest'
import { parseManifest } from '../src/chain/manifest.js'

const manifest = { schemaVersion: 1, chainId: 1874, startBlock: '123', contracts: { subscriptions: '0x1111111111111111111111111111111111111111' } }

test('a valid manifest retains the selected chain, block and addresses', () => {
  expect(parseManifest(manifest, 1874)).toEqual(manifest)
})

test.each([
  { ...manifest, chainId: 11155111 },
  { ...manifest, schemaVersion: 2 },
  { ...manifest, startBlock: '-1' },
  { ...manifest, startBlock: 123 },
  { ...manifest, contracts: {} },
  { ...manifest, contracts: { subscriptions: '0x0000000000000000000000000000000000000000' } },
  { ...manifest, contracts: { subscriptions: 'invalid' } },
])('invalid or cross-chain manifests fail closed', value => {
  expect(() => parseManifest(value, 1874)).toThrow()
})
