import { privateKeyToAccount } from 'viem/accounts'

const variables = {
  executor: 'EXECUTOR_PRIVATE_KEY',
  relayer: 'WHITECHAIN_RELAYER_PRIVATE_KEY',
  dispatch: 'DISPATCH_SIGNING_KEY',
  dispenser: 'DISPENSER_PRIVATE_KEY',
} as const

/** Read a role's key only when its signing operation is explicitly requested. */
export function getRoleAccount(role: keyof typeof variables, env: NodeJS.ProcessEnv = process.env) {
  const variable = variables[role]
  const value = env[variable]
  if (!value) throw new Error(`Required env var "${variable}" is not set`)
  try {
    if (!/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error('format')
    return privateKeyToAccount(value as `0x${string}`)
  } catch {
    // Do not pass viem's raw error through: it can include the invalid key.
    throw new Error(`Invalid EVM private key in ${variable}`)
  }
}
