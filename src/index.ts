/**
 * Lightning Network support for x402 protocol using Nostr Wallet Connect (NWC).
 *
 * This package provides Lightning Network support for the x402 payment protocol,
 *
 * @module
 */

// Exact scheme (re-exports client implementation by default)
export { ExactLightningScheme } from "./exact";

// Types
export * from "./types";

// Constants
export * from "./constants";

// Utilities
export * from "./utils";
