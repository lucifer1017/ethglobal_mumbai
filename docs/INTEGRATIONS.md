# Meter partner integration guide

Use these source references to review and reproduce the current integrations.
The repository is being published in small components; it is not yet a complete
marketplace deployment.

## Whitechain Sepolia

- [Chain selection and canonical USDT metadata](../backend/src/chain/registry.ts#L23-L55)
  use viem's `whitechainSepolia`, chain 1874, with separate RPC/explorer metadata.
- [Public and role-specific clients](../backend/src/chain/client.ts) separate
  keyless reads from the Whitechain relayer and Sepolia executor signers.
- Gasless USDT settlement through EIP-3009 remains planned. These configuration
  modules alone are not proof of a successful USDT payment.

## Uniswap on Ethereum Sepolia

- [The QuoterV2 call](../backend/scripts/check-uniswap-network.ts#L23-L26)
  simulates `quoteExactInputSingle` for canonical USDC to WETH at fee tier 500 (0.05%).
- The same script checks chain 11155111, code at the canonical SwapRouter02 and
  QuoterV2 addresses, and token decimals 6/18 before requesting a quote.
- [Recorded public RPC output](evidence/U-01/network-check.json) identifies the
  block, contract/token addresses, input amount and nonzero quoted output.
- The check submits no transaction, approval or swap. A quote does not establish
  execution, received output, or a working recurring subscription.

### Reproduce the read-only Uniswap check

With Node 24 selected and from the repository root:

```sh
npm ci --prefix backend --ignore-scripts
cd backend
npx tsx scripts/check-uniswap-network.ts
```

The public RPC is the default; `UNISWAP_NETWORK_RPC_URL` can select a server-side
endpoint. No wallet, funded account or API credential is required. The script
refreshes the public evidence JSON. Never put a keyed RPC URL in frontend config.

## Other checks

Run `npm run typecheck` and `npm test` from backend for local component checks.
PostgreSQL tests require their disposable harness; from the root, run
`npm run check:migration-runner` with Docker available. The optional live HTTPS
check is enabled by `METER_EGRESS_LIVE_TEST=1`. Skipped external/database cases
must not be reported as completed checks.

For sponsor submissions, link to the actual integration lines above and describe
implemented behavior separately from planned settlement and worker execution.
