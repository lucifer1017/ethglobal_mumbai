# S-04: lazy runtime configuration part

Local checks on 2026-11-07 (Asia/Kolkata), Node 24.22.2.

This part adds the public config factory and seven scoped tests, using the
already published registry/manifest/key components. It adds only dotenv16.6.1;
prior SDK, logger, compiler and viem versions remain unchanged.

Verification A: clean locked install, typecheck and all37 minimal-backend tests
pass (8 SDK,14 registry/signing,8 manifest,7 config). Production audit reports
zero vulnerabilities. The selected-chain fixture supplies the synthetic address
and bigint indexing start block read by the config's lazy getters.

Verification B: config loads when a proxy throws on any funded private-key
access, without a deployment file. A missing requested contract or another
chain's missing manifest fails at getter access. Invalid dispatch public
addresses and non-finite/nonpositive gas ceilings fail. No network request,
funded credential, API server, DB, indexer, process integration or live deployment
is used or claimed. Output paths are replaced with `<checkout>` in logs.

The manifest schema is documented in `docs/interfaces/deployment-manifest.md`;
the same documentation is copied back to the primary source checkout. No
placeholder deployment manifest is added. S-04 remains in progress.
