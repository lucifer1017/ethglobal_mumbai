# Published dependency baseline

This first S-07 integration selects Node 24 for local work and CI. The root npm
package requires Node >=24 and <25 and has no external dependencies.

CI actions are pinned to their published release commits:

| Action | Release | Commit |
|---|---|---|
| actions/checkout | v7.0.1 | 3d3c42e5aac5ba805825da76410c181273ba90b1 |
| actions/setup-node | v7.1.0 | 949feb2413d6458794dcd2491c4babbbce0c15c1 |

Application packages, Solidity tooling and their version constraints will arrive
in separate checked integrations. This is not completion of S-07 or Phase 1.
