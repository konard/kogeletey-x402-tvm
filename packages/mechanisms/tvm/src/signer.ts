import type { TonClient, KeyPair } from '@eversdk/core'
import { NETWORK_CONFIG } from './constants'

/**
 * Client-side signer for creating and signing Everscale TVM transactions
 * This wraps the TonClient and key pair for payment operations
 */
export type ClientTvmSigner = {
  /**
   * The TonClient instance for blockchain operations
   */
  client: TonClient

  /**
   * The key pair for signing transactions
   */
  keys: KeyPair

  /**
   * The sender's address (owner of the token wallet)
   */
  address: string
}

/**
 * Configuration for client operations
 */
export type ClientTvmConfig = {
  /**
   * Optional custom network endpoints
   */
  endpoints?: string[]
}

/**
 * Facilitator signer interface for TVM operations.
 * Supports multiple signers for load balancing and high availability.
 */
export type FacilitatorTvmSigner = {
  /**
   * Get all addresses this facilitator can use for fee sponsoring
   * Enables dynamic address selection for load balancing
   *
   * @returns Array of addresses available for signing
   */
  getAddresses(): readonly string[]

  /**
   * Send a signed external message to the network
   *
   * @param message - Base64 encoded message BOC
   * @param network - CAIP-2 network identifier
   * @returns Transaction ID/hash
   * @throws Error if send fails
   */
  sendMessage(message: string, network: string): Promise<string>

  /**
   * Wait for transaction confirmation
   *
   * @param messageId - Message ID to track
   * @param network - CAIP-2 network identifier
   * @returns Transaction hash when confirmed
   * @throws Error if confirmation fails or times out
   */
  confirmTransaction(messageId: string, network: string): Promise<string>

  /**
   * Query the balance of a TIP-3 token wallet
   *
   * @param walletAddress - Token wallet contract address
   * @param network - CAIP-2 network identifier
   * @returns Token balance in atomic units
   */
  getTokenBalance(walletAddress: string, network: string): Promise<string>

  /**
   * Query account information
   *
   * @param address - Account address
   * @param network - CAIP-2 network identifier
   * @returns Account info including balance and code hash
   */
  getAccountInfo(
    address: string,
    network: string,
  ): Promise<{
    balance: string
    codeHash?: string
    isDeployed: boolean
  }>

  /**
   * Simulate/verify a message before sending
   *
   * @param message - Base64 encoded message BOC
   * @param network - CAIP-2 network identifier
   * @throws Error if message would fail
   */
  simulateMessage(message: string, network: string): Promise<void>
}

/**
 * Configuration for FacilitatorTvmSigner
 */
export type FacilitatorTvmConfig = {
  /**
   * Custom network endpoints mapping (network CAIP-2 -> endpoints array)
   */
  endpoints?: Record<string, string[]>
}

/**
 * Convert a TonClient and keys to ClientTvmSigner
 *
 * @param client - The TonClient instance
 * @param keys - The key pair for signing
 * @param address - The sender's address
 * @returns The signer as ClientTvmSigner
 */
export function toClientTvmSigner(
  client: TonClient,
  keys: KeyPair,
  address: string,
): ClientTvmSigner {
  return { client, keys, address }
}

/**
 * Get network endpoints for a given network identifier
 *
 * @param network - CAIP-2 network identifier
 * @param customEndpoints - Optional custom endpoints
 * @returns Array of endpoint URLs
 */
export function getNetworkEndpoints(network: string, customEndpoints?: string[]): string[] {
  if (customEndpoints && customEndpoints.length > 0) {
    return customEndpoints
  }

  const config = NETWORK_CONFIG[network]
  if (!config) {
    throw new Error(`Unsupported TVM network: ${network}`)
  }

  return config.endpoints
}

/**
 * Create a FacilitatorTvmSigner from a TonClient and key pair
 *
 * @param client - The TonClient instance
 * @param keys - The key pair for the facilitator
 * @param address - The facilitator's address
 * @param config - Optional configuration
 * @returns A complete FacilitatorTvmSigner
 *
 * @example
 * ```ts
 * import { TonClient } from "@eversdk/core";
 * import { libNode } from "@eversdk/lib-node";
 *
 * TonClient.useBinaryLibrary(libNode);
 *
 * const client = new TonClient({
 *   network: { endpoints: ["https://mainnet.evercloud.dev/graphql"] }
 * });
 *
 * const keys = await client.crypto.generate_random_sign_keys();
 * const address = "0:...";
 *
 * const facilitator = toFacilitatorTvmSigner(client, keys, address);
 * ```
 */
export function toFacilitatorTvmSigner(
  client: TonClient,
  keys: KeyPair,
  address: string,
  config?: FacilitatorTvmConfig,
): FacilitatorTvmSigner {
  return {
    getAddresses: () => {
      return [address]
    },

    sendMessage: async (message: string, network: string) => {
      // Get endpoints for the network
      const endpoints = getNetworkEndpoints(network, config?.endpoints?.[network])

      // Create a network-specific client if needed
      const networkClient = new (client.constructor as typeof TonClient)({
        network: { endpoints },
      })

      try {
        // Send the message to the network
        const result = await networkClient.processing.send_message({
          message,
          send_events: false,
        })

        return result.shard_block_id
      } finally {
        // Clean up the client
        await networkClient.close()
      }
    },

    confirmTransaction: async (messageId: string, network: string) => {
      const endpoints = getNetworkEndpoints(network, config?.endpoints?.[network])

      const networkClient = new (client.constructor as typeof TonClient)({
        network: { endpoints },
      })

      try {
        // Wait for transaction
        const result = await networkClient.processing.wait_for_transaction({
          message: messageId,
          shard_block_id: messageId,
          send_events: false,
        })

        return result.transaction?.id ?? ''
      } finally {
        await networkClient.close()
      }
    },

    getTokenBalance: async (walletAddress: string, network: string) => {
      const endpoints = getNetworkEndpoints(network, config?.endpoints?.[network])

      const networkClient = new (client.constructor as typeof TonClient)({
        network: { endpoints },
      })

      try {
        // Query the token wallet contract for balance
        // TIP-3 wallets have a `balance` getter
        const result = await networkClient.net.query_collection({
          collection: 'accounts',
          filter: { id: { eq: walletAddress } },
          result: 'boc',
        })

        if (!result.result || result.result.length === 0) {
          return '0'
        }

        // TODO: Decode the account BOC and call the balance getter
        // For now, return "0" as placeholder
        return '0'
      } finally {
        await networkClient.close()
      }
    },

    getAccountInfo: async (accountAddress: string, network: string) => {
      const endpoints = getNetworkEndpoints(network, config?.endpoints?.[network])

      const networkClient = new (client.constructor as typeof TonClient)({
        network: { endpoints },
      })

      try {
        const result = await networkClient.net.query_collection({
          collection: 'accounts',
          filter: { id: { eq: accountAddress } },
          result: 'balance code_hash acc_type',
        })

        if (!result.result || result.result.length === 0) {
          return {
            balance: '0',
            isDeployed: false,
          }
        }

        const account = result.result[0]
        return {
          balance: account.balance || '0',
          codeHash: account.code_hash,
          isDeployed: account.acc_type === 1, // Active account
        }
      } finally {
        await networkClient.close()
      }
    },

    simulateMessage: async (message: string, network: string) => {
      const endpoints = getNetworkEndpoints(network, config?.endpoints?.[network])

      const networkClient = new (client.constructor as typeof TonClient)({
        network: { endpoints },
      })

      try {
        // Simulate the message execution
        // This will throw if the message would fail
        await networkClient.tvm.run_executor({
          message,
          account: {
            type: 'None',
          },
          execution_options: {
            blockchain_config: undefined,
            block_time: undefined,
            block_lt: undefined,
            transaction_lt: undefined,
          },
        })
      } finally {
        await networkClient.close()
      }
    },
  }
}
