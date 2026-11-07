# U-01: public Uniswap Sepolia check

This integration performs keyless read-only checks against Ethereum Sepolia:
canonical SwapRouter02/QuoterV2 code, USDC/WETH decimals6/18, and a nonzero
QuoterV2 quoteExactInputSingle simulation at the recorded block. No transaction,
approval, subscription or executed swap is claimed. U-01 remains incomplete.

Run after backend npm ci:
`cd backend && npx tsx scripts/check-uniswap-network.ts`

No credentials or local wallet files are required. An optional first argument
may name a public address-book JSON with an addresses map; never pass private keys.
The script stores its current public RPC result in network-check.json.

Checked with Node24.22.2 and viem2.57.16. The live public-RPC call returned nonzero
output; backend typecheck passed. Existing offline checks passed in the preparation
checkout (69tests;9explicit DB/external cases skipped without their harness).
This slice adds no dependency and does not publish the separately queued auth helper.
