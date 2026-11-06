import {
  createPublicClient,
  createWalletClient,
  http,
} from 'viem'
import { getChainConfig } from './registry.js'
import { getRoleAccount } from './keys.js'

/** Keyless client for Meter reads. Wallet construction stays explicit. */
export function buildPublicClient(chainId: number, env: NodeJS.ProcessEnv = process.env) {
  const config = getChainConfig(chainId, env)
  return createPublicClient({ chain: config.chain, transport: http(config.rpcUrl) })
}

/** Fixed chain per funded role; never take the chain from an API request. */
export function buildRoleClients(role: 'executor' | 'relayer', env: NodeJS.ProcessEnv = process.env) {
  const account = getRoleAccount(role, env)
  const config = getChainConfig(role === 'relayer' ? 1874 : 11155111, env)
  return {
    publicClient: buildPublicClient(config.chainId, env),
    walletClient: createWalletClient({ account, chain: config.chain, transport: http(config.rpcUrl) }),
    account,
    chain: config.chain,
  }
}

export type Clients = ReturnType<typeof buildRoleClients>
