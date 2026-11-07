# Meter working rules

- Use Node 24, selected by `.nvmrc`; run the checks for each change before publishing.
- The owner selected direct pushes to `main`: no feature branches or pull requests.
- Publish one small, newly specified and integrated piece at a time. Never bulk-upload
  legacy code or legacy commit history. Include only dependencies needed by that piece.
- Owner update2026-11-07: push checked contributions immediately; no interval is required.
  Record successful push times locally.
- Never force-push or delete `main`. CI runs after every main push.
- Owner update2026-11-07: the active contributor is `neelpote`; commit and push as
  `neelpote <177764465+neelpote@users.noreply.github.com>`. The repository owner
  remains `lucifer1017`. This supersedes the earlier single-account identity rule.
- No AI attribution in commits. No secrets, private keys, passwords or real `.env` files.
- Keep testnet runtime keys separate by role; deployer keys stay in encrypted keystores.
- Each task needs evidence for both its direct check and a different failure/independent check.
- Do not describe local, planned or partial work as deployed, live or fully verified.
- Contract deployment waits for the tested `cp3` tag. No mainnet deployment is authorized.
