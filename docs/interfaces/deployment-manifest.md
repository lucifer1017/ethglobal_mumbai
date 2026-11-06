# Deployment manifest schema, version 1

Status: implemented by the chain component parser and lazy runtime config.
This documents a file format, not a deployed contract or verified address.
Generate real manifests from the tested `cp3` deployment; do not reuse the old
Arbitrum deployment, invent addresses, or add a production placeholder manifest.

## Fields

| Field | Type | Rule |
|---|---|---|
| `schemaVersion` | number | Exactly `1` |
| `chainId` | number | Must equal the chain selected by the caller; Meter's registry allows Whitechain Sepolia `1874` and Ethereum Sepolia `11155111` |
| `startBlock` | string | Nonnegative decimal integer, without a leading zero except `"0"`; retained as a string and converted to bigint for indexing |
| `contracts` | object | Nonempty map of contract names to nonzero EVM addresses |

Contract names match `^[a-z][a-zA-Z0-9]*$`. Address strings must be valid EVM
addresses; the parser normalizes their checksum. Arrays, empty maps, zero
addresses, mismatched chains and unsupported schema versions are rejected.

The generic parser validates the map, while the runtime config requires a
specific contract name when a consumer accesses its getter:

| Getter | Manifest key |
|---|---|
| `subscriptionsAddr` | `subscriptions` |
| `serviceFactoryAddr` | `serviceFactory` |
| `validationRegistryAddr` | `validationRegistry` |
| `meterPaymentsAddr` | `meterPayments` |
| `aggregatorAddr` (temporary legacy executor property) | `swapRouter02` |

Not every chain uses every getter. Missing a requested contract fails with a
named error rather than substituting an old deployment. The default stable
token and optional WETH output metadata come from the chain registry, not from
this contracts map.

## Files and loading

Default paths, relative to the repository root:

- `contracts/deployments/whitechain-sepolia.json`
- `contracts/deployments/ethereum-sepolia.json`

`DEPLOYMENT_MANIFEST_DIR` overrides the directory. Prefer an absolute path;
relative overrides resolve from the process working directory. File selection
is fixed by the selected chain and cannot be chosen by a request's calldata.

`createConfig(env)` selects `CHAIN_ID` (default `11155111`) and the chain's RPC.
Importing public config requires neither a deployment file nor a funded key.
The selected manifest is loaded and cached only when a contract address or
`indexerStartBlock` is accessed. Missing/unreadable JSON fails at that access.
Restart the process after changing deployment files.

`dispatchAddress` returns the explicitly supplied public
`METER_DISPATCH_ADDRESS`, derives it from the separate fundless
`DISPATCH_SIGNING_KEY` when requested, or returns null. It never loads a relayer
or executor key. Do not serialize the full config or registry: database URLs,
API keys and keyed RPC URLs are private server configuration.

Tests use synthetic manifests in temporary directories. No fixture address is
a deployment, payment recipient or public funding destination.
