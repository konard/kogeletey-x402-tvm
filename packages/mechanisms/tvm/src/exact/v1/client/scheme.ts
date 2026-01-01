import type { PaymentPayload, PaymentRequirements, SchemeNetworkClient } from '@x402/core/types'
import type { ClientTvmSigner, ClientTvmConfig } from '../../../signer'
import type { ExactTvmPayloadV1 } from '../../../types'

/**
 * TIP-3 Token Wallet ABI for transfer operations (V1)
 */
const TIP3_TOKEN_WALLET_ABI = {
  'ABI version': 2,
  version: '2.2',
  header: ['pubkey', 'time', 'expire'],
  functions: [
    {
      name: 'transfer',
      inputs: [
        { name: 'amount', type: 'uint128' },
        { name: 'recipient', type: 'address' },
        { name: 'deployWalletValue', type: 'uint128' },
        { name: 'remainingGasTo', type: 'address' },
        { name: 'notify', type: 'bool' },
        { name: 'payload', type: 'cell' },
      ],
      outputs: [],
    },
  ],
  data: [],
  events: [],
}

/**
 * TVM client implementation for the Exact payment scheme (V1 compatibility).
 * Creates payment payloads using V1 format (message only, no expireAt).
 */
export class ExactTvmScheme implements SchemeNetworkClient {
  readonly scheme = 'exact'

  /**
   * Creates a new ExactTvmClient V1 instance.
   *
   * @param signer - The TVM signer for client operations
   * @param config - Optional configuration with custom endpoints
   * @returns ExactTvmClient instance
   */
  constructor(
    private readonly signer: ClientTvmSigner,
    private readonly config?: ClientTvmConfig,
  ) {}

  /**
   * Creates a payment payload for the Exact scheme (V1 format).
   *
   * @param x402Version - The x402 protocol version
   * @param paymentRequirements - The payment requirements
   * @returns Promise resolving to a payment payload
   */
  async createPaymentPayload(
    x402Version: number,
    paymentRequirements: PaymentRequirements,
  ): Promise<Pick<PaymentPayload, 'x402Version' | 'payload'>> {
    // Get the sender's token wallet address from extra
    const senderTokenWallet = paymentRequirements.extra?.senderTokenWallet as string
    if (!senderTokenWallet) {
      throw new Error(
        'senderTokenWallet is required in paymentRequirements.extra for TVM transfers',
      )
    }

    // Build the TIP-3 transfer message
    const { message } = await this.signer.client.abi.encode_message({
      abi: { type: 'Contract', value: TIP3_TOKEN_WALLET_ABI },
      address: senderTokenWallet,
      call_set: {
        function_name: 'transfer',
        input: {
          amount: paymentRequirements.amount,
          recipient: paymentRequirements.payTo,
          deployWalletValue: '0',
          remainingGasTo: this.signer.address,
          notify: true,
          payload: '',
        },
      },
      signer: {
        type: 'Keys',
        keys: this.signer.keys,
      },
      processing_try_index: 0,
    })

    // V1 format: message only
    const payload: ExactTvmPayloadV1 = {
      message,
    }

    return {
      x402Version,
      payload,
    }
  }
}
