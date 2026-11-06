import { readFileSync } from 'node:fs'
import { getAddress, isAddress, zeroAddress, type Address } from 'viem'

export interface DeploymentManifest {
  schemaVersion: 1
  chainId: number
  startBlock: string
  contracts: Record<string, Address>
}

export function parseManifest(input: unknown, chainId: number): DeploymentManifest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid deployment manifest')
  const value = input as Record<string, unknown>
  if (value.schemaVersion !== 1 || value.chainId !== chainId) throw new Error('Manifest schema or chain mismatch')
  if (typeof value.startBlock !== 'string' || !/^(0|[1-9]\d*)$/.test(value.startBlock)) {
    throw new Error('Manifest startBlock must be a nonnegative integer string')
  }
  if (!value.contracts || typeof value.contracts !== 'object' || Array.isArray(value.contracts)) {
    throw new Error('Manifest contracts must be an object')
  }
  const contracts: Record<string, Address> = {}
  for (const [name, address] of Object.entries(value.contracts)) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(name) || typeof address !== 'string'
      || !isAddress(address, { strict: false }) || address.toLowerCase() === zeroAddress) {
      throw new Error('Manifest contains an invalid contract entry')
    }
    contracts[name] = getAddress(address)
  }
  if (!Object.keys(contracts).length) throw new Error('Manifest must contain deployed contracts')
  return { schemaVersion: 1, chainId, startBlock: value.startBlock, contracts }
}

export function loadManifest(path: string, chainId: number): DeploymentManifest {
  let input: unknown
  try { input = JSON.parse(readFileSync(path, 'utf8')) }
  catch { throw new Error(`Missing or unreadable deployment manifest for chain ${chainId}`) }
  return parseManifest(input, chainId)
}
