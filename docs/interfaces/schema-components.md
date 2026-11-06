# Standalone chain schema components

`backend/src/db/schema/chain-primitives.sql` contains the four typed domains,
token metadata table and per-chain cursor table extracted from the newly specified
chain-accounting work. It is a reusable SQL component, not an application boot
migration. It requires no legacy users, agents, subscriptions or accounting tables.

`meter_uint256` uses unconstrained NUMERIC with an integer/range check: fractional
base units fail instead of being rounded. Addresses and hashes are lowercase
0x-prefixed hex. Chains are limited to Whitechain Sepolia 1874 and Ethereum Sepolia
11155111. Tokens are identified by chain/address; cursors by chain, with nonnegative
safe blocks no later than their processed block. Token deployment metadata is
not seeded here.

## Source and publication history reconciliation

The primary development checkout currently applies its legacy-derived
`0001_baseline.sql` followed by `0002_chain_accounting.sql`. Neither file is copied
into this publication. The standalone component extracts only the four domains,
`tokens` and `chain_cursors` definitions from source 0002. Its test wraps that SQL
in a temporary `0001_test_primitives.sql` under a random disposable schema and
removes it afterward. That test name is never an application migration identity.

The publication has a migration runner but no production numbered migration
directory or application schema history. These two database histories must not be
treated as interchangeable: copying their `schema_migrations` rows, renaming an
applied file or changing its checksum would be invalid. Existing source databases
continue to use their original history; they must not run this component directly
on top of already-created domains/tables.

A later application integration must define its canonical fresh-install numbered
SQL and any required explicit upgrade path before boot wiring is published. It
must include these definitions exactly once, preserve all applied migration bytes,
and verify both fresh and applicable upgrade paths. This component does not
establish that history or migrate a source database. Payments, event dedupe and
legacy table prerequisites remain separate checked integrations; S-05 is incomplete.
