# I-3: standalone egress guard component

Checked on 2026-11-07 (Asia/Kolkata), Node 24.22.2. Only the standalone endpoint
validator/fetch helper and its tests are integrated. I-3 remains incomplete until
registration, invocation and x402 consumers use the guard and pass their checks.

Verification A: clean locked installation, typecheck, full offline suite and
opt-in live suite pass. Offline: 67 tests pass, one external test intentionally
skipped. With `METER_EGRESS_LIVE_TEST=1`: all 68 tests pass, including public
HTTPS JSON and four real PostgreSQL migration-runner tests in a disposable
container. Production audit reports zero vulnerabilities; earlier locked
versions are unchanged. This does not verify any deployed marketplace endpoint.

Verification B: private, reserved and mapped IPs, mixed public/private DNS,
credentials/fragments, alternate ports and production development exceptions
are rejected. The local server verifies a single vetted DNS lookup, no redirect
follow, JSON content type, bounded body size and body timeout. Slow DNS counts
toward the same total timeout. No production credential is used.

Source copies match the stable primary checkout byte-for-byte. SHA-256:

- `backend/src/utils/egress.ts`: `a3cecb9918d6211f36fcb01a174a5a3ecab1092ffeed494cc3e1cd87ef5ff36b`
- `backend/test/egress.test.ts`: `3e3507f31f79af84955300d2409c16d87b9ee2ec8f32ede8898ce0bcdc07af65`

Paths in logs are normalized to `<checkout>`. API/creator/payment consumers,
application database schema and legacy routes are not included.
