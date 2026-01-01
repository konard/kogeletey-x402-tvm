import { ExactTvmScheme } from './scheme'
import type { FacilitatorTvmSigner } from '../../signer'

/**
 * Configuration for registering the Exact TVM facilitator scheme
 */
export type ExactTvmFacilitatorConfig = {
  /**
   * The TVM signer for facilitator operations
   */
  signer: FacilitatorTvmSigner
}

/**
 * Create an ExactTvmScheme facilitator instance
 *
 * @param config - Configuration for the facilitator
 * @returns ExactTvmScheme facilitator instance
 *
 * @example
 * ```ts
 * import { createExactTvmFacilitator } from "@x402/tvm/exact/facilitator";
 * import { TonClient } from "@eversdk/core";
 * import { toFacilitatorTvmSigner } from "@x402/tvm";
 *
 * const client = new TonClient({
 *   network: { endpoints: ["https://mainnet.evercloud.dev/graphql"] }
 * });
 * const keys = await client.crypto.generate_random_sign_keys();
 *
 * const signer = toFacilitatorTvmSigner(client, keys, "0:...");
 * const facilitator = createExactTvmFacilitator({ signer });
 * ```
 */
export function createExactTvmFacilitator(config: ExactTvmFacilitatorConfig): ExactTvmScheme {
  return new ExactTvmScheme(config.signer)
}
