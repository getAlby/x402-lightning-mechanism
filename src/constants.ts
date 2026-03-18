/**
 * network identifiers for Lightning Network (Bitcoin)
 */
export const LIGHTNING_MAINNET_CAIP2 = "lightning:mainnet";
export const LIGHTNING_TESTNET_CAIP2 = "lightning:testnet";
export const LIGHTNING_MUTINYNET_CAIP2 = "lightning:mutinynet";

/**
 * Supported Lightning network CAIP-2 identifiers
 */
export const LIGHTNING_NETWORKS = [LIGHTNING_MAINNET_CAIP2, LIGHTNING_TESTNET_CAIP2, LIGHTNING_MUTINYNET_CAIP2] as const;

/**
 * Supported x402 protocol version
 */
export const SUPPORTED_X402_VERSION = 2;
