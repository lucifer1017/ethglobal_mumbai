# Meter

A marketplace for paid AI agents, being integrated for Whitechain Sepolia
payments and Uniswap DCA execution on Ethereum Sepolia.

Implementation is arriving in small, tested integrations on main. This repository does
not yet contain a runnable application or deployed contracts. Earlier Daemon
source is retained separately; it is not bulk-imported into this history.

## Runtime check

Select Node 24 (`nvm use` with the supplied `.nvmrc`), then run:

```sh
npm ci
npm run check:runtime
```

## Contract toolchain check

Install Foundry 1.9.0, select Node 24, then run:

```sh
npm run check:contracts
```

This installs pinned libraries and compiles/tests a temporary probe with solc
0.8.30 and Prague. It sends no chain transaction and deploys no product contract.

## Backend SDK helper

The first backend integration contains only the marketplace-copy helper, not an
API server. It accepts an optional API key and falls back deterministically when
no key is provided or the model response is unusable.

```sh
npm --prefix backend ci
npm --prefix backend run typecheck
npm --prefix backend test
```

Tests exercise SDK serialization and fallback cases with mocked fetch; no paid
model call, wallet, chain transaction or deployment is made.

## Chain components

The backend package also exports the two-chain registry, manifest validation,
keyless public-client builder and explicit role-based signing builders. Public
reads do not access signing keys. The relayer is fixed to Whitechain Sepolia and
the executor to Ethereum Sepolia; invalid keys produce sanitized errors.

The backend tests cover these components without network calls or funded keys.
Application process wiring and live deployment manifests are not included yet.

## Runtime configuration component

`createConfig(env)` loads public settings without requiring funded keys or live
deployments. Contract addresses and the indexer start block are read lazily from
the selected chain's manifest. See the [manifest schema](docs/interfaces/deployment-manifest.md).
This component is not an API server or complete process integration.

## Isolated migration runner

Run `npm run check:migration-runner` with Docker available. It creates a temporary
PostgreSQL 16 container, runs the entire minimal backend suite including four
runner integration tests, and removes the container. No application database or
application SQL is involved. Without `METER_TEST_DATABASE_URL`, ordinary backend
tests skip the DB suite; the launcher and CI always supply a disposable DB.

## Agent endpoint guard

The standalone `safeFetch` helper validates public HTTPS endpoints, pins the
vetted DNS address, rejects redirects and bounds response time and JSON body
size. Offline tests use a local server; an exact `EGRESS_DEV_ALLOW` origin is
accepted only outside production. Run `METER_EGRESS_LIVE_TEST=1 npm run check:migration-runner` to include the optional
public HTTPS test. Registration
and paid invocation consumers will be integrated separately.

## Dispatch envelope interface

[The dispatch envelope v1 contract](docs/interfaces/dispatch-envelope.md) defines
canonical parameter/body hashes and raw-digest EIP-191 signatures. Six shared
synthetic vectors have a reference test. Regenerate them with
`node scripts/generate-dispatch-vectors.mjs` after installing backend dependencies.
This interface does not implement payment verification, durable replay protection
or a production signer.

## Chain schema component

The standalone [chain primitives SQL](backend/src/db/schema/chain-primitives.sql)
defines exact base-unit domains, token identity and per-chain cursors. Disposable
PostgreSQL tests exercise it in an isolated schema. It is not an application boot
migration; [schema history reconciliation](docs/interfaces/schema-components.md)
explains how it relates to the separate development checkout.

## Uniswap integration proof

[Sepolia QuoterV2 simulation](backend/scripts/check-uniswap-network.ts#L23-L26)
checks the deployed router/quoter, token decimals and nonzero USDC-to-WETH quote.
[Recorded RPC evidence](docs/evidence/U-01/network-check.json) is a simulation,
not an executed swap. Recurring settlement remains under development.

[Partner integration guide](docs/INTEGRATIONS.md): source pointers, reproducible
read-only checks, and the current boundaries of the Whitechain/Uniswap integrations.
