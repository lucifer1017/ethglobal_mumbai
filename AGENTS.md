# Meter working rules

- Use Node 24, selected by `.nvmrc`; run the checks for each change before publishing.
- The owner selected direct pushes to `main`: no feature branches or pull requests.
- Publish one small, newly specified and integrated piece at a time. Never bulk-upload
  legacy code or legacy commit history. Include only dependencies needed by that piece.
- Space consecutive pushes 7–8 minutes apart. Record successful push times locally.
- Never force-push or delete `main`. CI runs after every main push.
- Commit as `lucifer1017 <149046534+lucifer1017@users.noreply.github.com>`.
- No AI attribution in commits. No secrets, private keys, passwords or real `.env` files.
- Keep testnet runtime keys separate by role; deployer keys stay in encrypted keystores.
- Each task needs evidence for both its direct check and a different failure/independent check.
- Do not describe local, planned or partial work as deployed, live or fully verified.
- Contract deployment waits for the tested `cp3` tag. No mainnet deployment is authorized.
