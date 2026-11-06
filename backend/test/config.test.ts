import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { createConfig } from '../src/config.js'

const directories: string[] = []
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })
const address = '0x1111111111111111111111111111111111111111'
const manifest = { schemaVersion: 1, chainId: 1874, startBlock: '123', contracts: { subscriptions: address } }

test('public configuration loads without deployments or any funded key access', () => {
  const env = new Proxy({ CHAIN_ID: '1874' }, {
    get(target, name) {
      if (String(name).includes('PRIVATE_KEY')) throw new Error('Funded key read by configuration')
      return Reflect.get(target, name)
    },
  })
  const config = createConfig(env)
  expect(config.chainId).toBe(1874)
  expect(config.network.stableToken.symbol).toBe('USDT')
  expect(config.dispatchAddress).toBeNull()
  expect('privateKey' in config).toBe(false)
})

test('addresses and deployment start block come only from the selected chain manifest', () => {
  const directory = mkdtempSync(join(tmpdir(), 'meter-manifest-'))
  directories.push(directory)
  writeFileSync(join(directory, 'whitechain-sepolia.json'), JSON.stringify(manifest))
  const config = createConfig({ CHAIN_ID: '1874', DEPLOYMENT_MANIFEST_DIR: directory })
  expect(config.subscriptionsAddr).toBe(address)
  expect(config.indexerStartBlock).toBe(123n)
  expect(() => config.serviceFactoryAddr).toThrow('Missing serviceFactory deployment')
  expect(() => createConfig({ CHAIN_ID: '11155111', DEPLOYMENT_MANIFEST_DIR: directory }).subscriptionsAddr)
    .toThrow('Missing or unreadable deployment manifest')
})

test('public dispatch address is distinct from a funded platform spender', () => {
  const config = createConfig({ METER_DISPATCH_ADDRESS: address })
  expect(config.dispatchAddress).toBe(address)
  expect(() => createConfig({ METER_DISPATCH_ADDRESS: 'not-an-address' }).dispatchAddress).toThrow()
})

test.each(['NaN', 'Infinity', '-1', '0'])('invalid gas ceiling %s fails at startup', value => {
  expect(() => createConfig({ MAX_GAS_GWEI: value })).toThrow('Invalid MAX_GAS_GWEI')
})
