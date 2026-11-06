# S-04: chain, signing and manifest components

Local checks on 2026-11-07 (Asia/Kolkata), Node 24.22.2.

This part contains only registry, manifest parser/loader, keyless client and
explicit role-signing builders. No process config, API, indexer, DB, workers,
legacy deployment or other backend source is imported.

Verification A: clean locked install, TypeScript check and the minimal backend
suite pass: 30 tests (8 SDK, 14 registry/signing and 8 manifest cases).
`viem` resolves to 2.57.16; SDK1.6.0, pino10.4.0 and TypeScript5.9.3 are unchanged.
Production audit reports zero vulnerabilities. See the four command logs.

Verification B: tests reject unsupported/old chain IDs, invalid RPC schemes,
wrong-chain/schema manifests, invalid contract addresses and invalid role keys.
Public-client tests throw if any signing-key field is accessed, and verify
clients have no account. Role builders require only the relevant key and fix
the executor to Sepolia and relayer to Whitechain. Invalid key errors are
sanitized. Test signing keys are known synthetic scalars, never funded wallets.

No test performs a network request or chain transaction. RPC/explorer/token
metadata is configuration, not a live deployment or settlement claim.
The current confirmation defaults are Whitechain5/Sepolia3 from the phase plan.
Local checkout paths in logs are replaced with `<checkout>`.

S-04 remains in progress: process consumers, Compose integration and live
manifests are separate work. No whole-phase VERIFIED status is claimed.
