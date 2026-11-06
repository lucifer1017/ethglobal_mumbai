import 'dotenv/config'
import { getAddress, isAddress, type Address } from 'viem'
import { getChainConfig } from './chain/registry.js'
import { loadManifest } from './chain/manifest.js'
import { getRoleAccount } from './chain/keys.js'

function positiveInt(value: string | undefined, fallback: number, name: string): number {
  const parsed = value === undefined ? fallback : Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`Invalid ${name}`)
  return parsed
}

/** Public configuration does not load funded signers or require deployments at import. */
export function createConfig(env: NodeJS.ProcessEnv = process.env) {
  const chainId = Number(env.CHAIN_ID || '11155111')
  const network = getChainConfig(chainId, env)
  let deployment: ReturnType<typeof loadManifest> | undefined
  const manifest = () => deployment ??= loadManifest(network.manifestPath, chainId)
  const maxGasGwei = Number(env.MAX_GAS_GWEI || '50')
  if (!Number.isFinite(maxGasGwei) || maxGasGwei <= 0) throw new Error('Invalid MAX_GAS_GWEI')
  const contract = (name: string): Address => {
    const address = manifest().contracts[name]
    if (!address) throw new Error(`Missing ${name} deployment for chain ${chainId}`)
    return address
  }
  return {
    chainId, network,
    rpcUrl: network.rpcUrl,
    get subscriptionsAddr() { return contract('subscriptions') },
    get serviceFactoryAddr() { return contract('serviceFactory') },
    get validationRegistryAddr() { return contract('validationRegistry') },
    get meterPaymentsAddr() { return contract('meterPayments') },
    // Legacy executor names retained until U-04/U-05 route migration.
    get aggregatorAddr() { return contract('swapRouter02') },
    get outputTokenAddr() {
      const address = network.wrappedNativeToken?.address
      if (!address) throw new Error('DCA output token is unavailable on this chain')
      return address
    },
    usdcAddr: network.stableToken.address,
    get indexerStartBlock() { return BigInt(manifest().startBlock) },
    indexerPollMs: network.pollMs,
    agentId: BigInt(env.AGENT_ID || '1'),
    minTrustScore: BigInt(env.MIN_TRUST_SCORE || '0'),
    maxGasGwei,
    schedulerIntervalMs: positiveInt(env.SCHEDULER_INTERVAL_SECS, 30, 'SCHEDULER_INTERVAL_SECS') * 1000,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    databaseUrl: env.DATABASE_URL || 'postgresql://localhost:5432/meter',
    apiPort: positiveInt(env.API_PORT, 3001, 'API_PORT'),
    get dispatchAddress(): Address | null {
      if (env.METER_DISPATCH_ADDRESS) {
        if (!isAddress(env.METER_DISPATCH_ADDRESS, { strict: false })) throw new Error('Invalid METER_DISPATCH_ADDRESS')
        return getAddress(env.METER_DISPATCH_ADDRESS)
      }
      return env.DISPATCH_SIGNING_KEY ? getRoleAccount('dispatch', env).address : null
    },
  }
}

export const config = createConfig()
