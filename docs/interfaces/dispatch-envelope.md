# Meter dispatch envelope v1

Status: Phase1 interface and synthetic vectors only. Production signer, on-chain
payment verifier, consumed-payment store and worker integration belong to I-1/I-1b
in Phase3. P-04's temporary internal DCA HMAC is replaced at that integration.

The request is JSON, with signature header `X-Meter-Dispatch: 0x…`.
All fields below are signed. Unknown fields are rejected to prevent interpretation
from differing across implementations. The JSON profile permits only JSON values,
finite numbers and valid Unicode strings; monetary values and chain uint256 values
are decimal strings. Do not serialize bigint, undefined, NaN or Infinity.

| Field | Requirement |
| --- | --- |
| `v` | Exactly number1 |
| `chainId` | Integer1874 for invoke/preflight;11155111 for unpaid DCA decide |
| `kind` | `invoke`, `decide`, or `preflight`; must match the receiving endpoint |
| `requestId` | Nonempty opaque string, at most128 characters; unique per request |
| `paymentId` | Required for invoke, lowercase0x-prefixed bytes32; absent otherwise |
| `txHash` | Required for invoke, lowercase0x-prefixed bytes32; absent otherwise |
| `params` | JSON object; contains the exact validated work inputs |
| `paramsHash` | Lowercase0x-prefixed bytes32, calculated below |
| `issuedAt` | Nonnegative integer Unix seconds |
| `expiresAt` | Integer, issuedAt < expiresAt <= issuedAt+60 |

For a receiver's clock `now`, reject `issuedAt > now` or `expiresAt <= now`.
No grace period silently extends the60-second validity. Deployments must synchronize
clocks. `/v1/preflight` performs parameter validation only; it never does paid work.
An unpaid decide/preflight request has no paymentId/txHash and cannot authorize invoke.

1. Compute `canonicalParams = JCS(params)` using RFC8785 JSON Canonicalization.
2. Compute `paramsHash = keccak256(UTF8(canonicalParams))`.
3. Build the complete body, then `bodyDigest = keccak256(UTF8(JCS(body)))`.
4. Sign the **32 raw digest bytes** with Ethereum personal_sign/EIP-191:
   viem `account.signMessage({ message: { raw: bodyDigest } })`.
   Signing the66-character hex string as text produces a different signature and
   is not this protocol. The EIP-191 prefix declares a32-byte message.
5. The verifier recomputes both hashes and recovers the signer with the same raw
   message. Compare to the configured public `METER_DISPATCH_ADDRESS`, never to an
   address supplied by the request. No funded key is needed by a worker.

Key ordering does not change JCS hashes; array order and string contents do.
Do not hash ordinary JSON.stringify output in place of JCS. Reject invalid types
before canonicalization rather than relying on permissive serialization.

## Paid invocation checks (required before work)

Signature/expiry/hash validity is necessary but does not prove payment. The receiver
must additionally require the configured chain's manifest MeterPayments address,
a successful receipt for txHash, matching PaymentSettled paymentId/paramsHash/payer,
its own payee/token and an amount covering its quoted price, plus registry K
confirmations. The quote and payload must agree with the exact event. A request
cannot choose a contract/RPC or lower the server's expected price/confirmation depth.

Reserve paymentId atomically in durable storage before starting work. A completed
paymentId cannot run again; retries retrieve the stored result or conflict. Separate
unpaid request IDs receive a bounded replay cache. Crash recovery must not silently
repeat external effects. Missing signature returns401; reused payment returns409.
Full payment/replay integration is not implemented by these vectors.

## Shared vectors

`dispatch-envelope.vectors.json` uses well-known synthetic scalars1/2, never local
wallets, and fixed verification time1800000000. All transaction/payment IDs are
fictional fixtures. Cases: valid, canonical-key-order, expired, wrong signer,
tampered params and wrong paramsHash. The generator is
`scripts/generate-dispatch-vectors.mjs`; the backend reference test recomputes
hashes and signer recovery. Agent verifiers must later run the same fixture file.
