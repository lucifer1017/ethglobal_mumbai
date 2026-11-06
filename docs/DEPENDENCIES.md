# Published dependency baseline

This first S-07 integration selects Node 24 for local work and CI. The root npm
package requires Node >=24 and <25 and has no external dependencies.

CI actions are pinned to their published release commits:

| Action | Release | Commit |
|---|---|---|
| actions/checkout | v7.0.1 | 3d3c42e5aac5ba805825da76410c181273ba90b1 |
| actions/setup-node | v7.1.0 | 949feb2413d6458794dcd2491c4babbbce0c15c1 |

The contract toolchain part of S-07 pins Foundry 1.9.0, solc 0.8.30, EVM Prague
and via-IR compilation. Library tags are OpenZeppelin v5.6.1 and forge-std v1.17.0;
`scripts/install-contract-deps.sh` installs them without creating commits or
submodules, and rejects a different installed package version.

CI installs Foundry with the official foundry-rs/foundry-toolchain v1 action,
pinned to dba66c27052e63476d886f22216e119ba7e615bf, and selects v1.9.0 explicitly.
The check compiles and tests a temporary probe against both libraries and reads
its compiler metadata. No application contract or deployment is introduced.

Application packages will arrive in separate checked integrations. This is not
completion of S-07 or Phase 1.

## Backend SDK part

The isolated marketplace-copy helper uses `@anthropic-ai/sdk ^1.6.0` and
`pino ^10.4.0`. Its development tools are TypeScript `~5.9.3`, `@types/node ^24`,
`tsx ^4.23.15` and `vitest ^5.1.0`. Its lockfile is generated from only these
requirements; route, database, chain and indexer packages are not imported.

The helper uses `claude-haiku-5-5`, low effort and 1024 output tokens. API access
is explicitly passed by the caller, so no-key operation and tests need no env
or funded signer. All tests mock fetch; live model access is not verified here.

## Chain component part

The isolated chain registry, manifest parser and client builders add
`viem ^2.57.16` to the minimal backend package. Other backend versions remain
unchanged. Networks come from viem's `whitechainSepolia` (1874) and `sepolia`
(11155111) definitions; unsupported IDs fail rather than inventing a chain.

No legacy API/config/indexer, DB driver or worker dependency is part of this
integration. Runtime process wiring and live deployment manifests remain separate.
