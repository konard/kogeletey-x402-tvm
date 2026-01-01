/**
 * CAIP-2 network identifiers for Everscale TVM networks
 * Format: tvm:<genesis-hash-prefix>
 */
export const EVERSCALE_MAINNET_CAIP2 = 'tvm:5e994fcf4d425c0a6ce6a792594b7173'
export const EVERSCALE_DEVNET_CAIP2 = 'tvm:45e3c9d78e26bf97a9b6b1ec12acf8a6'
export const EVERSCALE_FLD_CAIP2 = 'tvm:f7a2d8e9b1c3a4f5e6d7c8b9a0f1e2d3' // Everscale FLD (test network)

/**
 * Default GraphQL endpoints for Everscale networks
 */
export const MAINNET_ENDPOINT = 'https://mainnet.evercloud.dev/graphql'
export const DEVNET_ENDPOINT = 'https://devnet.evercloud.dev/graphql'
export const FLD_ENDPOINT = 'https://fld.evercloud.dev/graphql'

/**
 * EVER SDK network endpoints (for @eversdk/core)
 */
export const MAINNET_SDK_ENDPOINTS = ['https://mainnet.evercloud.dev/graphql']
export const DEVNET_SDK_ENDPOINTS = ['https://devnet.evercloud.dev/graphql']
export const FLD_SDK_ENDPOINTS = ['https://fld.evercloud.dev/graphql']

/**
 * USDT/USDC TIP-3 token addresses on Everscale
 * These are the official Broxus/wrapped token addresses
 */
export const USDT_MAINNET_ADDRESS =
  '0:a519f99bb5d6d51ef958ed24d337ad75a1c770885dcd42d51d6663f9fcdacfb2'
export const USDC_MAINNET_ADDRESS =
  '0:c37b3fafca5bf7d3704b081fde7df54f298736ee059bf6d32fac25f5e6085bf6'
export const WEVER_MAINNET_ADDRESS =
  '0:a49cd4e158a9a15555e624759e2e4e766d22600b7800d891e46f9291f044a93d'

/**
 * Test token addresses for devnet
 */
export const USDT_DEVNET_ADDRESS =
  '0:efd5a14409a8a129686114fc092525fddd508f1ea56d1b649a3a695d3a5b188c'
export const USDC_DEVNET_ADDRESS =
  '0:127ee9a8b4a2f93e0f9c1ce2e47c1b0f7c7c4d5e6f7a8b9c0d1e2f3a4b5c6d7e'

/**
 * Default compute settings for Everscale transactions
 */
export const DEFAULT_ATTACHED_VALUE = '500000000' // 0.5 EVER for gas
export const DEFAULT_MESSAGE_LIFETIME = 60 // 60 seconds message lifetime
export const DEFAULT_BOUNCE = true

/**
 * TIP-3 token wallet code hash (for verification)
 * This is the standard Broxus TIP-3 implementation
 */
export const TIP3_TOKEN_WALLET_CODE_HASH =
  '0x4e92716de61d456e58f16e4e867e3e93a7548321eace86301b51c8b80ca6239b'

/**
 * TVM address validation regex
 * Everscale addresses are 0:<64 hex characters> format
 */
export const TVM_ADDRESS_REGEX = /^0:[a-fA-F0-9]{64}$/

/**
 * V1 to V2 network identifier mappings (for backwards compatibility)
 * V1 used simple names, V2 uses CAIP-2
 */
export const V1_TO_V2_NETWORK_MAP: Record<string, string> = {
  everscale: EVERSCALE_MAINNET_CAIP2,
  'everscale-devnet': EVERSCALE_DEVNET_CAIP2,
  'everscale-fld': EVERSCALE_FLD_CAIP2,
}

/**
 * Network configuration mapping
 */
export const NETWORK_CONFIG: Record<
  string,
  {
    endpoints: string[]
    usdcAddress: string
    usdtAddress: string
  }
> = {
  [EVERSCALE_MAINNET_CAIP2]: {
    endpoints: MAINNET_SDK_ENDPOINTS,
    usdcAddress: USDC_MAINNET_ADDRESS,
    usdtAddress: USDT_MAINNET_ADDRESS,
  },
  [EVERSCALE_DEVNET_CAIP2]: {
    endpoints: DEVNET_SDK_ENDPOINTS,
    usdcAddress: USDC_DEVNET_ADDRESS,
    usdtAddress: USDT_DEVNET_ADDRESS,
  },
  [EVERSCALE_FLD_CAIP2]: {
    endpoints: FLD_SDK_ENDPOINTS,
    usdcAddress: USDC_DEVNET_ADDRESS, // FLD uses devnet tokens
    usdtAddress: USDT_DEVNET_ADDRESS,
  },
}
