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
