import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import canonicalize from 'canonicalize'
import { keccak256, toBytes, recoverMessageAddress, type Hex } from 'viem'

// Reference check for Phase1 format only; this is not the production payment verifier.
const fixture = JSON.parse(readFileSync(new URL('../../docs/interfaces/dispatch-envelope.vectors.json',import.meta.url),'utf8'))
test.each(fixture.vectors)('shared dispatch format vector: $name',async (vector) => {
  const body = vector.body
  const paramsHash = keccak256(toBytes(canonicalize(body.params)!))
  const digest = keccak256(toBytes(canonicalize(body)!))
  const signer = await recoverMessageAddress({message:{raw:digest},signature:vector.signature as Hex})
  const valid = body.v === 1 && body.chainId === 1874 && body.kind === 'invoke'
    && body.paramsHash === paramsHash && body.issuedAt <= fixture.now && body.expiresAt > fixture.now
    && body.expiresAt > body.issuedAt && body.expiresAt <= body.issuedAt+60
    && signer.toLowerCase() === fixture.expectedSigner.toLowerCase()
  expect(valid).toBe(vector.expectedValid)
})
