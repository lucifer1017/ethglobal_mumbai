import { expect, test } from 'vitest'
import { getChainConfig } from '../src/chain/registry.js'
import { buildPublicClient, buildRoleClients } from '../src/chain/client.js'
import { getRoleAccount } from '../src/chain/keys.js'

test('the two planned chains have their own currency, finality and explorers', () => {
  const whitechain = getChainConfig(1874, {})
  const uniswap = getChainConfig(11155111, {})
  expect(whitechain.chain.id).toBe(1874)
  expect(whitechain.nativeSymbol).toBe('WBT')
  expect(whitechain.confirmations).toBe(5)
  expect(whitechain.explorerTxUrl).toBe('https://explorer.testnet.whitechain.io/tx/')
  expect(uniswap.nativeSymbol).toBe('ETH')
  expect(uniswap.confirmations).toBe(3)
  expect(uniswap.name).toBe('ethereum-sepolia')
  expect(uniswap.explorerTxUrl).not.toBe(whitechain.explorerTxUrl)
})

test.each([2625, 421614, 1, 0, NaN])('unsupported chain %s is rejected', chainId => {
  expect(() => getChainConfig(chainId, {})).toThrow('Unsupported Meter chain ID')
})

test('keyless clients use their own RPC and never attach an account', () => {
  const env = {
    WHITECHAIN_RPC_URL: 'http://127.0.0.1:8545',
    UNISWAP_NETWORK_RPC_URL: 'http://127.0.0.1:8546',
  }
  for (const [chainId, url] of [[1874, env.WHITECHAIN_RPC_URL], [11155111, env.UNISWAP_NETWORK_RPC_URL]] as const) {
    const client = buildPublicClient(chainId, env)
    expect(client.chain?.id).toBe(chainId)
    expect(client.transport.url).toBe(url)
    expect(client.account).toBeUndefined()
  }
})

test.each(['file:///tmp/rpc', 'not-a-url', 'ws://localhost:8545'])('invalid HTTP transport %s is rejected', rpcUrl => {
  expect(() => getChainConfig(1874, { WHITECHAIN_RPC_URL: rpcUrl })).toThrow()
})

test('a public client never reads any signing credential, even if keys exist', () => {
  const env = new Proxy({ WHITECHAIN_RPC_URL: 'http://localhost:8545' }, {
    get(target, key) {
      if (String(key).includes('KEY')) throw new Error('Signing key accessed by a reader')
      return Reflect.get(target, key)
    },
  })
  expect(buildPublicClient(1874, env).account).toBeUndefined()
})

test('each funded role requires only its own key and has a fixed chain', () => {
  // Publicly known test-only scalar. Never used as a deployed/funded wallet.
  const testKey = `0x${'1'.padStart(64, '0')}`
  expect(buildRoleClients('executor', { EXECUTOR_PRIVATE_KEY: testKey }).chain.id).toBe(11155111)
  expect(buildRoleClients('relayer', { WHITECHAIN_RELAYER_PRIVATE_KEY: testKey }).chain.id).toBe(1874)
  expect(() => buildRoleClients('executor', { WHITECHAIN_RELAYER_PRIVATE_KEY: testKey }))
    .toThrow('EXECUTOR_PRIVATE_KEY')
})

test.each(['not-a-key', `0x${'0'.repeat(64)}`])('invalid role keys produce sanitized errors', key => {
  try {
    getRoleAccount('dispatch', { DISPATCH_SIGNING_KEY: key })
    throw new Error('Invalid key was accepted')
  } catch (error) {
    expect(String(error)).toContain('Invalid EVM private key in DISPATCH_SIGNING_KEY')
    expect(String(error)).not.toContain(key)
  }
})
