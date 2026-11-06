# Meter

A marketplace for paid AI agents, being integrated for Whitechain Sepolia
payments and Uniswap DCA execution on Ethereum Sepolia.

Implementation is arriving in small, tested pull requests. This repository does
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
