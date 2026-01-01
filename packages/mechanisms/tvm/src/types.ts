/**
 * Exact TVM payload structure containing a base64 encoded Everscale message
 */
export type ExactTvmPayloadV1 = {
  /**
   * Base64 encoded external message for TIP-3 token transfer
   */
  message: string
}

/**
 * Exact TVM payload V2 structure with additional metadata
 */
export type ExactTvmPayloadV2 = {
  /**
   * Base64 encoded external message for TIP-3 token transfer
   */
  message: string

  /**
   * Message expiration timestamp (Unix seconds)
   */
  expireAt: number
}

/**
 * TVM transfer parameters for TIP-3 token transfers
 */
export type TvmTransferParams = {
  /**
   * Sender's token wallet address
   */
  senderTokenWallet: string

  /**
   * Recipient's token wallet address
   */
  recipientTokenWallet: string

  /**
   * Amount to transfer in atomic units
   */
  amount: string

  /**
   * Sender's address (owner of the token wallet)
   */
  senderAddress: string

  /**
   * Recipient's address (owner of the recipient token wallet)
   */
  recipientAddress: string

  /**
   * Token root contract address
   */
  tokenRoot: string

  /**
   * Optional payload for callback
   */
  payload?: string
}

/**
 * TVM account information
 */
export type TvmAccountInfo = {
  /**
   * Account address
   */
  address: string

  /**
   * Account balance in nanoTON
   */
  balance: string

  /**
   * Account code hash (for contract verification)
   */
  codeHash?: string

  /**
   * Whether the account is deployed
   */
  isDeployed: boolean
}

/**
 * TIP-3 token wallet information
 */
export type Tip3WalletInfo = {
  /**
   * Token wallet contract address
   */
  address: string

  /**
   * Token balance in atomic units
   */
  balance: string

  /**
   * Owner address
   */
  owner: string

  /**
   * Token root address
   */
  root: string
}

/**
 * TIP-3 token root information
 */
export type Tip3RootInfo = {
  /**
   * Token root contract address
   */
  address: string

  /**
   * Token name
   */
  name: string

  /**
   * Token symbol
   */
  symbol: string

  /**
   * Token decimals
   */
  decimals: number

  /**
   * Total supply in atomic units
   */
  totalSupply: string
}
