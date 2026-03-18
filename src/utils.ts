import {
  LIGHTNING_NETWORKS,
} from "./constants";
import type { Network } from "@x402/core/types";

/**
 * Checks if a given network identifier is a supported Lightning network.
 *
 * @param network - The CAIP-2 network identifier to check
 * @returns `true` if the network is a supported Lightning network
 */
export function isLightningNetwork(network: Network): boolean {
  return (LIGHTNING_NETWORKS as ReadonlyArray<Network>).includes(network);
}
