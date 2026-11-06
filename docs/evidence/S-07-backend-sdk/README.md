# S-07: backend SDK helper part

Local checks on 2026-11-07 (Asia/Kolkata), Node 24.22.2.

This small integration contains the marketplace-copy helper and its logger only.
It accepts the API key explicitly; no chain config, funded wallet, route,
indexer, database, agent worker or existing backend tree is imported.

Verification A: clean `npm ci --ignore-scripts`, TypeScript 5.9.3 typecheck and
8 tests pass. The happy-path test exercises real SDK request serialization:
`claude-haiku-5-5`, effort `low`, `max_tokens: 1024`, and text after a thinking
block. Production audit reports zero vulnerabilities.

Verification B: refusal and token-limit responses discard even valid-looking
JSON. Malformed JSON and wrongly typed fields fall back deterministically.
No-key and empty-description calls make no request. All fetches are mocked;
there is no paid API call, real API credential or live model-access claim.

Outputs: `clean-install.log`, `typecheck.log`, `tests.log`,
`production-audit.log`. Local paths are replaced with `<checkout>`.
The task as a whole and Phase 1 remain in progress.
