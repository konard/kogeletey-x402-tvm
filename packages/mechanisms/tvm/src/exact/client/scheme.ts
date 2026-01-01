import type { PaymentPayload, PaymentRequirements, SchemeNetworkClient } from '@x402/core/types'
import { DEFAULT_MESSAGE_LIFETIME, DEFAULT_ATTACHED_VALUE } from '../../constants'
import type { ClientTvmSigner, ClientTvmConfig } from '../../signer'
import type { ExactTvmPayloadV2 } from '../../types'
import { getCurrentTimestamp, normalizeNetwork } from '../../utils'

/**
 * TIP-3 Token Wallet ABI for transfer operations
 * This is the standard Broxus TIP-3 implementation ABI subset
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
 * TVM client implementation for the Exact payment scheme.
 * Creates payment payloads by building TIP-3 token transfer messages.
 */
export class ExactTvmScheme implements SchemeNetworkClient {
  readonly scheme = 'exact'

  /**
   * Creates a new ExactTvmClient instance.
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
   * Creates a payment payload for the Exact scheme on Everscale TVM.
   * Builds a TIP-3 token transfer message signed by the client.
   *
   * @param x402Version - The x402 protocol version
   * @param paymentRequirements - The payment requirements
   * @returns Promise resolving to a payment payload with signed message
   */
  async createPaymentPayload(
    x402Version: number,
    paymentRequirements: PaymentRequirements,
  ): Promise<Pick<PaymentPayload, 'x402Version' | 'payload'>> {
    // Normalize the network to CAIP-2 format
    const network = normalizeNetwork(paymentRequirements.network)
    void network // Used for validation

    // Calculate message expiration
    const expireAt = getCurrentTimestamp() + DEFAULT_MESSAGE_LIFETIME

    // Get the sender's token wallet address from extra
    // The client needs to provide their token wallet address
    const senderTokenWallet = paymentRequirements.extra?.senderTokenWallet as string
    if (!senderTokenWallet) {
      throw new Error(
        'senderTokenWallet is required in paymentRequirements.extra for TVM transfers',
      )
    }

    // Build the TIP-3 transfer message
    // The message calls the `transfer` function on the sender's token wallet
    const { message } = await this.signer.client.abi.encode_message({
      abi: { type: 'Contract', value: TIP3_TOKEN_WALLET_ABI },
      address: senderTokenWallet,
      call_set: {
        function_name: 'transfer',
        input: {
          amount: paymentRequirements.amount,
          recipient: paymentRequirements.payTo,
          deployWalletValue: '0', // Recipient wallet should already exist
          remainingGasTo: this.signer.address,
          notify: true, // Notify recipient for x402 tracking
          payload: '', // Empty payload, can be used for custom data
        },
      },
      signer: {
        type: 'Keys',
        keys: this.signer.keys,
      },
      processing_try_index: 0,
    })

    // Create the payload with the encoded and signed message
    const payload: ExactTvmPayloadV2 = {
      message,
      expireAt,
    }

    return {
      x402Version,
      payload,
    }
  }

  /**
   * Get the attached value for gas in nanoEVER
   *
   * @returns Default attached value for transaction gas
   */
  getAttachedValue(): string {
    return DEFAULT_ATTACHED_VALUE
  }
}
