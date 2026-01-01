# @x402/tvm

TVM (Typed Value Model) adapter for the x402 payment protocol, enabling payments on the Everscale blockchain using TIP-3 tokens.

## Installation

```bash
npm install @x402/tvm @eversdk/core @eversdk/lib-node
```

## Quick Start

### Client Usage

```typescript
import { TonClient } from '@eversdk/core'
import { libNode } from '@eversdk/lib-node'
import { ExactTvmScheme, toClientTvmSigner } from '@x402/tvm'

// Initialize EVER SDK
TonClient.useBinaryLibrary(libNode)

const client = new TonClient({
  network: { endpoints: ['https://mainnet.evercloud.dev/graphql'] },
})

// Generate or load keys
const keys = await client.crypto.generate_random_sign_keys()
const address = '0:your_address_here'

// Create signer and scheme
const signer = toClientTvmSigner(client, keys, address)
const scheme = new ExactTvmScheme(signer)

// Create payment payload
const payload = await scheme.createPaymentPayload(2, {
  scheme: 'exact',
  network: 'tvm:5e994fcf4d425c0a6ce6a792594b7173',
  amount: '1000000', // 1 USDC
  asset: '0:c37b3fafca5bf7d3704b081fde7df54f298736ee059bf6d32fac25f5e6085bf6',
  payTo: '0:recipient_address',
  maxTimeoutSeconds: 60,
  extra: {
    senderTokenWallet: '0:your_token_wallet_address',
  },
})
```

### Server Usage

```typescript
import { ExactTvmScheme } from '@x402/tvm/exact/server'

const serverScheme = new ExactTvmScheme()

// Parse a price
const assetAmount = await serverScheme.parsePrice('$0.10', 'tvm:5e994fcf4d425c0a6ce6a792594b7173')
console.log(assetAmount)
// { amount: "100000", asset: "0:c37b3fafca5bf7d3704b081fde7df54f298736ee059bf6d32fac25f5e6085bf6", extra: {} }
```

### Facilitator Usage

```typescript
import { TonClient } from '@eversdk/core'
import { libNode } from '@eversdk/lib-node'
import { ExactTvmScheme, toFacilitatorTvmSigner } from '@x402/tvm/exact/facilitator'
import { toFacilitatorTvmSigner } from '@x402/tvm'

TonClient.useBinaryLibrary(libNode)

const client = new TonClient({
  network: { endpoints: ['https://mainnet.evercloud.dev/graphql'] },
})

const keys = await client.crypto.generate_random_sign_keys()
const signer = toFacilitatorTvmSigner(client, keys, '0:facilitator_address')

const facilitator = new ExactTvmScheme(signer)

// Verify a payment
const verifyResult = await facilitator.verify(paymentPayload, paymentRequirements)

// Settle a payment
const settleResult = await facilitator.settle(paymentPayload, paymentRequirements)
```

## Supported Networks

| Network           | CAIP-2 Identifier                      | Endpoints             |
| ----------------- | -------------------------------------- | --------------------- |
| Everscale Mainnet | `tvm:5e994fcf4d425c0a6ce6a792594b7173` | mainnet.evercloud.dev |
| Everscale Devnet  | `tvm:45e3c9d78e26bf97a9b6b1ec12acf8a6` | devnet.evercloud.dev  |
| Everscale FLD     | `tvm:f7a2d8e9b1c3a4f5e6d7c8b9a0f1e2d3` | fld.evercloud.dev     |

## Supported Tokens

- **USDC**: `0:c37b3fafca5bf7d3704b081fde7df54f298736ee059bf6d32fac25f5e6085bf6` (mainnet)
- **USDT**: `0:a519f99bb5d6d51ef958ed24d337ad75a1c770885dcd42d51d6663f9fcdacfb2` (mainnet)
- **WEVER**: `0:a49cd4e158a9a15555e624759e2e4e766d22600b7800d891e46f9291f044a93d` (mainnet)

## TIP-3 Token Standard

This adapter uses the TIP-3 token standard, which is Everscale's equivalent of ERC-20. Key differences:

1. **Distributed Architecture**: Each token holder has their own TokenWallet contract
2. **P2P Transfers**: Transfers happen directly between TokenWallet contracts
3. **No Central Registry**: Balances are stored in individual wallet contracts

## API Reference

### ExactTvmScheme (Client)

```typescript
class ExactTvmScheme implements SchemeNetworkClient {
  constructor(signer: ClientTvmSigner, config?: ClientTvmConfig)
  createPaymentPayload(
    x402Version: number,
    requirements: PaymentRequirements,
  ): Promise<PaymentPayload>
}
```

### ExactTvmScheme (Server)

```typescript
class ExactTvmScheme implements SchemeNetworkServer {
  parsePrice(price: Price, network: Network): Promise<AssetAmount>
  enhancePaymentRequirements(
    requirements: PaymentRequirements,
    supportedKind: SupportedKind,
    extensions: string[],
  ): Promise<PaymentRequirements>
  registerMoneyParser(parser: MoneyParser): ExactTvmScheme
}
```

### ExactTvmScheme (Facilitator)

```typescript
class ExactTvmScheme implements SchemeNetworkFacilitator {
  constructor(signer: FacilitatorTvmSigner)
  verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<VerifyResponse>
  settle(payload: PaymentPayload, requirements: PaymentRequirements): Promise<SettleResponse>
}
```

## License

Apache-2.0
