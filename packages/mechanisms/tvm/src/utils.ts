import type { Network } from '@x402/core/types'
import {
  TVM_ADDRESS_REGEX,
  V1_TO_V2_NETWORK_MAP,
  EVERSCALE_MAINNET_CAIP2,
  EVERSCALE_DEVNET_CAIP2,
  EVERSCALE_FLD_CAIP2,
  NETWORK_CONFIG,
} from './constants'

/**
 * Normalize network identifier to CAIP-2 format
 * Handles both V1 names (everscale, everscale-devnet) and V2 CAIP-2 format
 *
 * @param network - Network identifier (V1 or V2 format)
 * @returns CAIP-2 network identifier
 */
export function normalizeNetwork(network: Network): string {
  // If it's already CAIP-2 format (starts with "tvm:"), validate it's supported
  if (network.startsWith('tvm:')) {
    const supported = [EVERSCALE_MAINNET_CAIP2, EVERSCALE_DEVNET_CAIP2, EVERSCALE_FLD_CAIP2]
    if (!supported.includes(network)) {
      throw new Error(`Unsupported TVM network: ${network}`)
    }
    return network
  }

  // Otherwise, it's a V1 network name, convert to CAIP-2
  const caip2Network = V1_TO_V2_NETWORK_MAP[network]
  if (!caip2Network) {
    throw new Error(`Unsupported TVM network: ${network}`)
  }
  return caip2Network
}

/**
 * Validate Everscale TVM address format
 * Everscale addresses are in format: 0:<64 hex characters>
 *
 * @param address - Address string to validate
 * @returns true if address is valid, false otherwise
 */
export function validateTvmAddress(address: string): boolean {
  return TVM_ADDRESS_REGEX.test(address)
}

/**
 * Get the USDC token address for a given network
 *
 * @param network - Network identifier (CAIP-2 or V1 format)
 * @returns USDC token root address for the network
 */
export function getUsdcAddress(network: Network): string {
  const caip2Network = normalizeNetwork(network)
  const config = NETWORK_CONFIG[caip2Network]

  if (!config) {
    throw new Error(`No USDC address configured for network: ${network}`)
  }

  return config.usdcAddress
}

/**
 * Get the USDT token address for a given network
 *
 * @param network - Network identifier (CAIP-2 or V1 format)
 * @returns USDT token root address for the network
 */
export function getUsdtAddress(network: Network): string {
  const caip2Network = normalizeNetwork(network)
  const config = NETWORK_CONFIG[caip2Network]

  if (!config) {
    throw new Error(`No USDT address configured for network: ${network}`)
  }

  return config.usdtAddress
}

/**
 * Convert a decimal amount to token smallest units
 *
 * @param decimalAmount - The decimal amount (e.g., "0.10")
 * @param decimals - The number of decimals for the token (e.g., 6 for USDC)
 * @returns The amount in smallest units as a string
 */
export function convertToTokenAmount(decimalAmount: string, decimals: number): string {
  const amount = parseFloat(decimalAmount)
  if (isNaN(amount)) {
    throw new Error(`Invalid amount: ${decimalAmount}`)
  }
  // Convert to smallest unit (e.g., for USDC with 6 decimals: 0.10 * 10^6 = 100000)
  const [intPart, decPart = ''] = String(amount).split('.')
  const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals)
  const tokenAmount = (intPart + paddedDec).replace(/^0+/, '') || '0'
  return tokenAmount
}

/**
 * Convert token smallest units to decimal amount
 *
 * @param tokenAmount - The amount in smallest units
 * @param decimals - The number of decimals for the token
 * @returns The decimal amount as a string
 */
export function convertFromTokenAmount(tokenAmount: string, decimals: number): string {
  const amount = BigInt(tokenAmount)
  const divisor = BigInt(10 ** decimals)
  const intPart = amount / divisor
  const decPart = amount % divisor

  if (decPart === BigInt(0)) {
    return intPart.toString()
  }

  const decStr = decPart.toString().padStart(decimals, '0')
  // Remove trailing zeros
  const trimmedDec = decStr.replace(/0+$/, '')
  return `${intPart}.${trimmedDec}`
}

/**
 * Calculate the token wallet address for a given owner and token root
 * This is a deterministic calculation based on the TIP-3 standard
 *
 * @param ownerAddress - The owner's address
 * @param tokenRootAddress - The token root contract address
 * @returns The calculated token wallet address
 */
export function calculateTokenWalletAddress(
  ownerAddress: string,
  tokenRootAddress: string,
): string {
  // In a real implementation, this would use the actual TIP-3 wallet address calculation
  // which involves:
  // 1. Getting the token wallet code from the token root
  // 2. Building initial data with the owner address
  // 3. Computing the address hash
  //
  // For now, we return a placeholder that indicates the calculation needs to be done
  // by the client using the TonClient
  void ownerAddress
  void tokenRootAddress
  return ''
}

/**
 * Decode a base64 encoded message BOC
 *
 * @param base64Message - Base64 encoded message
 * @returns Decoded message bytes as Uint8Array
 */
export function decodeMessageBoc(base64Message: string): Uint8Array {
  // Use Buffer in Node.js environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64Message, 'base64')
  }

  // Use atob in browser environment
  const binaryString = atob(base64Message)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Encode message bytes to base64
 *
 * @param messageBytes - Message bytes as Uint8Array
 * @returns Base64 encoded string
 */
export function encodeMessageBoc(messageBytes: Uint8Array): string {
  // Use Buffer in Node.js environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(messageBytes).toString('base64')
  }

  // Use btoa in browser environment
  let binaryString = ''
  for (let i = 0; i < messageBytes.length; i++) {
    binaryString += String.fromCharCode(messageBytes[i])
  }
  return btoa(binaryString)
}

/**
 * Get current Unix timestamp in seconds
 *
 * @returns Current Unix timestamp
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Check if a timestamp has expired
 *
 * @param expireAt - Expiration timestamp in seconds
 * @returns true if expired, false otherwise
 */
export function isExpired(expireAt: number): boolean {
  return getCurrentTimestamp() >= expireAt
}

/**
 * Extract the sender address from a TIP-3 transfer message
 * This parses the message to find the authority/sender
 *
 * @param messageBoc - Base64 encoded message BOC
 * @returns Sender address or empty string if not found
 */
export function extractSenderFromMessage(messageBoc: string): string {
  // In a real implementation, this would:
  // 1. Decode the BOC
  // 2. Parse the message structure
  // 3. Extract the sender address from the message header
  //
  // For now, we return empty string as placeholder
  void messageBoc
  return ''
}
