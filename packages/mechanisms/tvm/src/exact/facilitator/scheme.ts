import type {
  PaymentPayload,
  PaymentRequirements,
  SchemeNetworkFacilitator,
  SettleResponse,
  VerifyResponse,
} from '@x402/core/types'
import type { FacilitatorTvmSigner } from '../../signer'
import type { ExactTvmPayloadV2 } from '../../types'
import { isExpired, normalizeNetwork, extractSenderFromMessage } from '../../utils'

/**
 * TVM facilitator implementation for the Exact payment scheme.
 * Verifies and settles TIP-3 token transfer payments on Everscale.
 */
export class ExactTvmScheme implements SchemeNetworkFacilitator {
  readonly scheme = 'exact'
  readonly caipFamily = 'tvm:*'

  /**
   * Creates a new ExactTvmFacilitator instance.
   *
   * @param signer - The TVM signer for facilitator operations
   * @returns ExactTvmFacilitator instance
   */
  constructor(private readonly signer: FacilitatorTvmSigner) {}

  /**
   * Get mechanism-specific extra data for the supported kinds endpoint.
   * For TVM, this may include facilitator address for gas assistance.
   *
   * @param _ - The network identifier (unused)
   * @returns Extra data or undefined
   */
  getExtra(_: string): Record<string, unknown> | undefined {
    // TVM doesn't require extra data like SVM's feePayer
    // Token transfers are paid by the sender
    return undefined
  }

  /**
   * Get signer addresses used by this facilitator.
   * For TVM, returns all available facilitator addresses.
   *
   * @param _ - The network identifier (unused)
   * @returns Array of facilitator addresses
   */
  getSigners(_: string): string[] {
    return [...this.signer.getAddresses()]
  }

  /**
   * Verifies a payment payload for TIP-3 token transfer.
   * Checks message validity, expiration, and simulates execution.
   *
   * @param payload - The payment payload to verify
   * @param requirements - The payment requirements
   * @returns Promise resolving to verification response
   */
  async verify(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<VerifyResponse> {
    const exactTvmPayload = payload.payload as ExactTvmPayloadV2

    // Step 1: Validate scheme
    if (payload.accepted.scheme !== 'exact' || requirements.scheme !== 'exact') {
      return {
        isValid: false,
        invalidReason: 'unsupported_scheme',
        payer: '',
      }
    }

    // Step 2: Validate network
    try {
      const payloadNetwork = normalizeNetwork(payload.accepted.network)
      const requirementsNetwork = normalizeNetwork(requirements.network)

      if (payloadNetwork !== requirementsNetwork) {
        return {
          isValid: false,
          invalidReason: 'network_mismatch',
          payer: '',
        }
      }
    } catch {
      return {
        isValid: false,
        invalidReason: 'invalid_network',
        payer: '',
      }
    }

    // Step 3: Validate message exists
    if (!exactTvmPayload.message) {
      return {
        isValid: false,
        invalidReason: 'invalid_exact_tvm_payload_missing_message',
        payer: '',
      }
    }

    // Step 4: Check expiration
    if (exactTvmPayload.expireAt && isExpired(exactTvmPayload.expireAt)) {
      return {
        isValid: false,
        invalidReason: 'invalid_exact_tvm_payload_message_expired',
        payer: '',
      }
    }

    // Extract sender from message for error reporting
    const payer = extractSenderFromMessage(exactTvmPayload.message)

    // Step 5: Simulate the message to ensure it would succeed
    try {
      await this.signer.simulateMessage(exactTvmPayload.message, requirements.network)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        isValid: false,
        invalidReason: `transaction_simulation_failed: ${errorMessage}`,
        payer,
      }
    }

    // Step 6: Verify the sender has sufficient token balance
    // This requires parsing the message to get the sender's token wallet
    // For now, we rely on simulation to catch insufficient balance
    // TODO: Add explicit balance check by parsing message

    return {
      isValid: true,
      invalidReason: undefined,
      payer,
    }
  }

  /**
   * Settles a payment by sending the TIP-3 transfer message to the network.
   *
   * @param payload - The payment payload to settle
   * @param requirements - The payment requirements
   * @returns Promise resolving to settlement response
   */
  async settle(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<SettleResponse> {
    const exactTvmPayload = payload.payload as ExactTvmPayloadV2

    // First verify the payment
    const valid = await this.verify(payload, requirements)
    if (!valid.isValid) {
      return {
        success: false,
        network: payload.accepted.network,
        transaction: '',
        errorReason: valid.invalidReason ?? 'verification_failed',
        payer: valid.payer || '',
      }
    }

    try {
      // Send the message to the network
      const messageId = await this.signer.sendMessage(exactTvmPayload.message, requirements.network)

      // Wait for confirmation
      const transactionId = await this.signer.confirmTransaction(messageId, requirements.network)

      return {
        success: true,
        transaction: transactionId,
        network: payload.accepted.network,
        payer: valid.payer,
      }
    } catch (error) {
      console.error('Failed to settle TVM transaction:', error)
      return {
        success: false,
        errorReason: 'transaction_failed',
        transaction: '',
        network: payload.accepted.network,
        payer: valid.payer || '',
      }
    }
  }
}
