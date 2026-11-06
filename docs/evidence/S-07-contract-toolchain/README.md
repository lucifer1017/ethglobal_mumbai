# S-07: contract toolchain part

Checked locally on 2026-11-07 (Asia/Kolkata), with Node 24.22.2 and Foundry 1.9.0.
This is a toolchain integration only, not completion of S-07 or Phase 1.

Verification A: `npm run check:contracts` installed OpenZeppelin v5.6.1 and
forge-std v1.17.0 from their pinned tags, then compiled and ran one temporary
Ownable/forge-std probe test. Result: 1 passed, 0 failed, 0 skipped.
The compiled artifact metadata records solc 0.8.30 and EVM Prague.
See `direct-check.log`; local checkout paths are replaced with `<checkout>`.

Verification B: a temporary fixture with installed OpenZeppelin version 0.0.0
was rejected by the installer with exit code 1 and the wrong-version assertion.
See `wrong-version-rejected.log`. The real dependency directory was not modified.

CI runs the same contract check on every direct main push. The official Foundry
action is pinned by commit and installs v1.9.0 explicitly.
No legacy product contract source, RPC credentials, wallet, transaction,
deployment, funded key or chain interaction is included in this part.
