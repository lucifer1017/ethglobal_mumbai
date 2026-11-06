# Phase 1 dispatch envelope interface and synthetic vectors

Checked on 2026-11-07 (Asia/Kolkata), Node 24.22.2. This integration specifies the
envelope and provides shared fixtures, a deterministic generator and reference
hash/recovery check. It does not complete I-1/I-1b, implement a production signer,
validate payment receipts, reserve consumed payments or authorize worker execution.

Verification A: fresh locked install, typecheck and generator pass. Regeneration
produces byte-identical fixtures with SHA-256
`9d561bbd7e0ecff0cdb7a3c76e4ce4b08df994fd8d8fd56a78ad38e4cbe058a8`.
The full suite passes 73 tests offline (one optional external test skipped) and
74 with the live egress check enabled, including real disposable PostgreSQL tests.
Production audit reports zero vulnerabilities; prior package versions remain
unchanged. Only canonicalize 5.1.0 is newly installed.

Verification B: expired envelopes, an unexpected signer, altered parameters and
an incorrect parameter hash fail the reference check. Canonical key reordering
preserves validity. These six format fixtures do not cover the entire specified
production validation surface; receiver clock, shape, payment and durable replay
checks still require their later implementations and tests.

The four source artifacts match the stable primary checkout byte-for-byte.
Fixture scalars 1/2, IDs, hashes and signatures are intentionally synthetic public
test data, explicitly permitted in the secret-pattern review. No local wallet,
runtime credential or deployment address is included. Log paths are normalized
to `<checkout>`.
