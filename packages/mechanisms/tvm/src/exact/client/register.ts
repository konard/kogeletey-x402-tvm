import type { Network } from '@x402/core/types'
import { ExactTvmScheme } from './scheme'
import type { ClientTvmSigner, ClientTvmConfig } from '../../signer'

/**
 * Configuration for registering the Exact TVM scheme
 */
export type ExactTvmClientConfig = {
  /**
   * The TVM signer for client operations
   */
  signer: ClientTvmSigner

  /**
   * Networks to register for (defaults to all TVM networks)
   */
  networks?: Network | Network[]

  /**
   * Optional client configuration
   */
  config?: ClientTvmConfig
}

/**
 * Create an ExactTvmScheme instance for registration with x402Client
 *
 * @param config - Configuration for the scheme
 * @returns ExactTvmScheme instance
 *
 * @example
 * ```ts
 * import { x402Client } from "@x402/core";
 * import { createExactTvmScheme } from "@x402/tvm/exact/client";
 * import { TonClient } from "@eversdk/core";
 *
 * const client = new TonClient({
 *   network: { endpoints: ["https://mainnet.evercloud.dev/graphql"] }
 * });
 * const keys = await client.crypto.generate_random_sign_keys();
 *
 * const x402 = new x402Client();
 * const tvmScheme = createExactTvmScheme({
 *   signer: { client, keys, address: "0:..." },
 * });
 *
 * x402.registerScheme(tvmScheme, "tvm:*");
 * ```
 */
export function createExactTvmScheme(config: ExactTvmClientConfig): ExactTvmScheme {
  return new ExactTvmScheme(config.signer, config.config)
}
