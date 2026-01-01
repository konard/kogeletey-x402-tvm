# Exact Payment Scheme for TVM (Everscale) (`exact`)

This document specifies the `exact` payment scheme for the x402 protocol on Everscale and other TVM-compatible blockchains.

This scheme facilitates payments of a specific amount of a TIP-3 token on the Everscale blockchain.

## Scheme Name

`exact`

## Protocol Flow

The protocol flow for `exact` on TVM is client-driven.

1. **Client** makes a request to a **Resource Server**.
2. **Resource Server** responds with a payment required signal containing `PaymentRequired`. The requirements include the token root address as `asset` and the recipient's address as `payTo`.
3. **Client** identifies their TIP-3 token wallet address for the specified token root.
4. **Client** creates and signs an external message calling the `transfer` function on their token wallet.
5. **Client** encodes the signed message as a Base64 string.
6. **Client** sends a new request to the resource server with the `PaymentPayload` containing the Base64-encoded signed message.
7. **Resource Server** receives the request and forwards the `PaymentPayload` and `PaymentRequirements` to a **Facilitator Server's** `/verify` endpoint.
8. **Facilitator** decodes the message and validates it.
9. **Facilitator** simulates the message execution to ensure it would succeed.
10. **Facilitator** returns a `VerifyResponse` to the **Resource Server**.
11. **Resource Server**, upon successful verification, forwards the payload to the facilitator's `/settle` endpoint.
12. **Facilitator Server** submits the message to the Everscale network.
13. Upon successful on-chain settlement, the **Facilitator Server** responds with a `SettlementResponse` to the **Resource Server**.
14. **Resource Server** grants the **Client** access to the resource in its response.

## `PaymentRequirements` for `exact`

Standard x402 `PaymentRequirements` fields with TVM-specific values:

```json
{
  "scheme": "exact",
  "network": "tvm:5e994fcf4d425c0a6ce6a792594b7173",
  "amount": "1000000",
  "asset": "0:c37b3fafca5bf7d3704b081fde7df54f298736ee059bf6d32fac25f5e6085bf6",
  "payTo": "0:2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4",
  "maxTimeoutSeconds": 60,
  "extra": {
    "senderTokenWallet": "0:abc123..."
  }
}
```

- `asset`: The TIP-3 token root contract address.
- `payTo`: The recipient's address (their token wallet will be derived from this).
- `extra.senderTokenWallet`: (Optional, client-provided) The sender's token wallet address.

## PaymentPayload `payload` Field

The `payload` field of the `PaymentPayload` contains:

```json
{
  "message": "te6ccgEBAQEAAgAAAA==",
  "expireAt": 1740672154
}
```

- `message`: Base64-encoded, signed external message for the TIP-3 token transfer.
- `expireAt`: Unix timestamp when the message expires.

Full `PaymentPayload` object:

```json
{
  "x402Version": 2,
  "resource": {
    "url": "https://example.com/weather",
    "description": "Access to protected content",
    "mimeType": "application/json"
  },
  "accepted": {
    "scheme": "exact",
    "network": "tvm:5e994fcf4d425c0a6ce6a792594b7173",
    "amount": "1000000",
    "asset": "0:c37b3fafca5bf7d3704b081fde7df54f298736ee059bf6d32fac25f5e6085bf6",
    "payTo": "0:2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4",
    "maxTimeoutSeconds": 60,
    "extra": {}
  },
  "payload": {
    "message": "te6ccgEBAQEAAgAAAA==",
    "expireAt": 1740672154
  }
}
```

## `SettlementResponse`

The `SettlementResponse` for the exact scheme on TVM:

```json
{
  "success": true,
  "transaction": "abc123def456...",
  "network": "tvm:5e994fcf4d425c0a6ce6a792594b7173",
  "payer": "0:857b06519E91e3A54538791bDbb0E22373e36b66..."
}
```

## Network Identifiers

TVM networks use CAIP-2 format with the `tvm` namespace:

| Network | CAIP-2 Identifier |
|---------|-------------------|
| Everscale Mainnet | `tvm:5e994fcf4d425c0a6ce6a792594b7173` |
| Everscale Devnet | `tvm:45e3c9d78e26bf97a9b6b1ec12acf8a6` |
| Everscale FLD | `tvm:f7a2d8e9b1c3a4f5e6d7c8b9a0f1e2d3` |

## TIP-3 Token Standard

TIP-3 is Everscale's fungible token standard, similar to ERC-20 but with key differences:

1. **Distributed Architecture**: Each token holder has their own TokenWallet contract.
2. **P2P Transfers**: Transfers happen directly between TokenWallet contracts.
3. **No Central Registry**: No single contract stores all balances.

### Transfer Function

The `transfer` function on a TIP-3 TokenWallet:

```solidity
function transfer(
    uint128 amount,
    address recipient,
    uint128 deployWalletValue,
    address remainingGasTo,
    bool notify,
    TvmCell payload
) external;
```

Parameters:
- `amount`: Amount to transfer in atomic units
- `recipient`: Address of the recipient (not their token wallet)
- `deployWalletValue`: EVER to attach for deploying recipient's wallet (0 if exists)
- `remainingGasTo`: Address to receive remaining gas
- `notify`: Whether to notify the recipient
- `payload`: Optional callback payload

## Facilitator Verification Rules (MUST)

A facilitator verifying an `exact`-scheme TVM payment MUST enforce all of the following checks:

1. **Message Structure**
   - The message MUST be a valid external message.
   - The message MUST target a TIP-3 TokenWallet contract.
   - The message MUST call the `transfer` function.

2. **Transfer Parameters**
   - The `amount` MUST equal `PaymentRequirements.amount` exactly.
   - The `recipient` MUST match `PaymentRequirements.payTo`.
   - The token wallet MUST be associated with the correct token root (`PaymentRequirements.asset`).

3. **Signature Validation**
   - The message MUST be properly signed by the token wallet owner.

4. **Expiration Check**
   - If `expireAt` is provided, the current time MUST be before the expiration.

5. **Simulation**
   - The message MUST be simulated to verify it would execute successfully.
   - This catches insufficient balance, invalid recipient, and other errors.

## Security Considerations

### Message Authenticity
- All messages are signed with the sender's private key.
- The signature is verified by the token wallet contract.

### Replay Protection
- Each message includes a timestamp and sequence number.
- The Everscale network rejects duplicate messages.

### Balance Verification
- Simulation verifies the sender has sufficient token balance.
- The actual transfer will fail if balance is insufficient at execution time.

## Implementation Notes

### Token Wallet Address Derivation

Token wallet addresses are deterministically computed from:
1. Token root contract address
2. Owner address
3. Token wallet code hash

This allows anyone to calculate a user's token wallet address without querying the blockchain.

### Gas Handling

Unlike SVM where the facilitator pays gas, TVM transfers require the sender to attach EVER for gas. The `remainingGasTo` parameter allows unused gas to be returned.

Recommended attached value: 0.5 EVER (500,000,000 nanoEVER)

### Supported Tokens

The reference implementation supports:
- USDT on Everscale Mainnet
- USDC on Everscale Mainnet
- WEVER (wrapped EVER)
- Custom TIP-3 tokens

## Appendix

### TIP-3 vs ERC-20

| Feature | TIP-3 | ERC-20 |
|---------|-------|--------|
| Balance Storage | Distributed (per-wallet contracts) | Centralized (single contract) |
| Transfer Method | P2P between wallets | Through token contract |
| Gas Payment | Sender pays | Sender pays |
| Approval Required | No | Yes (for third-party transfers) |

### References

- [TIP-3 Token Standard](https://docs.everscale.network/standard/TIP-3/)
- [TIP-3.2 Interface](https://docs.everscale.network/standard/TIP-3.2/)
- [Everscale Documentation](https://docs.everscale.network/)
- [EVER SDK](https://docs.everos.dev/ever-sdk/)
