# S-07, Node 24 runtime part

Local verification on 2026-11-07 (Asia/Kolkata):

- Verification A: a clean `npm ci --ignore-scripts` and
  `npm run check:runtime` pass on Node 24.22.2.
- Verification B: the same check fails on Node 25.2.1 with exit code 1 and
  the instruction to select Node 24. This verifies the version guard actually
  rejects an unsupported major version.

Raw outputs are in `install.log`, `node24-pass.log` and `node25-rejected.log`.
Local checkout paths in the failure trace are replaced with `<checkout>`.
CI repeats the direct check on every PR and on main. No credentials are used.

This is only the Node runtime part of S-07. Application dependency upgrades,
Docker images, Solidity settings and live-model checks are separate work;
S-07 and Phase 1 are not marked complete.
