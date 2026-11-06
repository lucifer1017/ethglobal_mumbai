# S-05: standalone chain-primitives schema component

Checked on 2026-11-07 (Asia/Kolkata), Node 24.22.2 and disposable PostgreSQL 16.
Only four domains, token metadata and chain cursors are integrated. The SQL
definitions match the corresponding sections of primary source 0002 exactly;
no legacy baseline or numbered application migration is published.

Verification A: typecheck and the full suite pass: 77 tests, including four new
real PostgreSQL tests; the optional external HTTPS test is skipped. Production
audit reports zero vulnerabilities. No package or dependency version changes.
The component applies once and the second run is a no-op in a random isolated
schema. Its only tables are tokens, chain_cursors and the test runner history.

Verification B: fractional, negative, overflowing and non-finite uint256 inputs
fail. Token duplicates fail on the same chain but the same address on another
chain succeeds. Invalid chains/addresses/decimals and invalid hash length fail.
Duplicate cursor chains, negative blocks and safe blocks beyond processed fail.
The temporary schema and migration directory are removed after tests.

Source/publication history reconciliation is specified in
`docs/interfaces/schema-components.md`. The test-only migration filename is not
an application migration identity. Existing source migration files and databases
are unchanged. Payment/event dedupe, application prerequisites, one-shot boot
wiring and a canonical application migration history remain outside this part;
S-05 is incomplete. Log paths are normalized to `<checkout>`.
