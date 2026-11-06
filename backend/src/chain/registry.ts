import { sepolia, whitechainSepolia } from 'viem/chains'
import type { Chain } from 'viem'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ChainConfig {
  chainId: number
  chain: Chain
  name: string
  rpcUrl: string
  explorerTxUrl: string
  nativeSymbol: string
  startBlock: bigint
  logChunkSize: number
  confirmations: number
  pollMs: number
  manifestPath: string
  stableToken: { address: `0x${string}`; symbol: string; decimals: number }
  wrappedNativeToken?: { address: `0x${string}`; symbol: string; decimals: number }
}

/** Only the two networks in the Meter plan are accepted. Never invent a chain. */
export function getChainConfig(chainId: number, env: NodeJS.ProcessEnv = process.env): ChainConfig {
  const chain = chainId === whitechainSepolia.id ? whitechainSepolia
    : chainId === sepolia.id ? sepolia : undefined
  if (!chain) throw new Error(`Unsupported Meter chain ID: ${chainId}`)

  const whitechain = chainId === whitechainSepolia.id
  const rpcUrl = env[whitechain ? 'WHITECHAIN_RPC_URL' : 'UNISWAP_NETWORK_RPC_URL']
    || chain.rpcUrls.default.http[0]
  let parsed: URL
  try { parsed = new URL(rpcUrl) }
  catch { throw new Error('Invalid chain RPC URL') }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Chain RPC URL must use HTTP or HTTPS')
  }

  return {
    chainId, chain, rpcUrl,
    name: whitechain ? 'whitechain-sepolia' : 'ethereum-sepolia',
    explorerTxUrl: `${chain.blockExplorers.default.url}/tx/`,
    nativeSymbol: chain.nativeCurrency.symbol,
    // Deployment manifests replace startBlock once contracts exist.
    startBlock: 0n,
    logChunkSize: 1_000,
    confirmations: whitechain ? 5 : 3,
    pollMs: whitechain ? 5_000 : 12_000,
    manifestPath: resolve(env.DEPLOYMENT_MANIFEST_DIR || fileURLToPath(new URL('../../../contracts/deployments/', import.meta.url)),
      whitechain ? 'whitechain-sepolia.json' : 'ethereum-sepolia.json'),
    stableToken: whitechain
      ? { address: '0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7', symbol: 'USDT', decimals: 6 }
      : { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC', decimals: 6 },
    ...(whitechain ? {} : { wrappedNativeToken: {
      address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14' as const, symbol: 'WETH', decimals: 18,
    } }),
  }
}
