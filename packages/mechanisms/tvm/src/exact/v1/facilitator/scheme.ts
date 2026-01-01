import type {
  PaymentPayload,
  PaymentRequirements,
  SchemeNetworkFacilitator,
  SettleResponse,
  VerifyResponse,
} from '@x402/core/types'
import type { FacilitatorTvmSigner } from '../../../signer'
import type { ExactTvmPayloadV1 } from '../../../types'
import { normalizeNetwork, extractSenderFromMessage } from '../../../utils'

/**
 * TVM facilitator implementation for the Exact payment scheme (V1 compatibility).
 */
export class ExactTvmScheme implements SchemeNetworkFacilitator {
  readonly scheme = 'exact'
  readonly caipFamily = 'tvm:*'

  /**
   * Creates a new ExactTvmFacilitator V1 instance.
   *
   * @param signer - The TVM signer for facilitator operations
   * @returns ExactTvmFacilitator instance
   */
  constructor(private readonly signer: FacilitatorTvmSigner) {}

  /**
   * Get mechanism-specific extra data for the supported kinds endpoint.
   *
   * @param _ - The network identifier (unused)
   * @returns undefined for TVM
   */
  getExtra(_: string): Record<string, unknown> | undefined {
    return undefined
  }

  /**
   * Get signer addresses used by this facilitator.
   *
   * @param _ - The network identifier (unused)
   * @returns Array of facilitator addresses
   */
  getSigners(_: string): string[] {
    return [...this.signer.getAddresses()]
  }

  /**
   * Verifies a payment payload (V1 format).
   *
   * @param payload - The payment payload to verify
   * @param requirements - The payment requirements
   * @returns Promise resolving to verification response
   */
  async verify(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<VerifyResponse> {
    const exactTvmPayload = payload.payload as ExactTvmPayloadV1

    // Validate scheme
    if (payload.accepted.scheme !== 'exact' || requirements.scheme !== 'exact') {
      return {
        isValid: false,
        invalidReason: 'unsupported_scheme',
        payer: '',
      }
    }

    // Validate network
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

    // Validate message exists
    if (!exactTvmPayload.message) {
      return {
        isValid: false,
        invalidReason: 'invalid_exact_tvm_payload_missing_message',
        payer: '',
      }
    }

    const payer = extractSenderFromMessage(exactTvmPayload.message)

    // Simulate the message
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

    return {
      isValid: true,
      invalidReason: undefined,
      payer,
    }
  }

  /**
   * Settles a payment (V1 format).
   *
   * @param payload - The payment payload to settle
   * @param requirements - The payment requirements
   * @returns Promise resolving to settlement response
   */
  async settle(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<SettleResponse> {
    const exactTvmPayload = payload.payload as ExactTvmPayloadV1

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
      const messageId = await this.signer.sendMessage(exactTvmPayload.message, requirements.network)

      const transactionId = await this.signer.confirmTransaction(messageId, requirements.network)

      return {
        success: true,
        transaction: transactionId,
        network: payload.accepted.network,
        payer: valid.payer,
      }
    } catch (error) {
      console.error('Failed to settle TVM V1 transaction:', error)
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
