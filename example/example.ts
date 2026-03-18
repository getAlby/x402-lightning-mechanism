/**
 * @x402/lightning — client usage example
 *
 * This script demonstrates how to pay for a protected HTTP resource using the
 * Lightning Network via Nostr Wallet Connect (NWC) and the x402 protocol.
 *
 * Prerequisites
 * -------------
 * 1. An NWC connection string from any NWC-compatible wallet:
 *      - Alby Hub  → https://albyhub.com
 *
 *    The connection string looks like:
 *      nostr+walletconnect://<walletPubkey>?relay=<relayUrl>&secret=<secret>
 *
 * 2. Sufficient balance in the wallet to pay the resource's requested amount.
 *
 * Usage
 * -----
 *   NWC_URL="nostr+walletconnect://..." \
 *   RESOURCE_URL="https://api.example.com/paid-endpoint" \
 *   npx tsx example.ts
 *
 * The script will:
 *   1. Make an initial GET request to RESOURCE_URL (may get a 402 response)
 *   2. Automatically pay the Lightning invoice embedded in the 402 via NWC
 *   3. Retry the request with the payment proof (preimage)
 *   4. Print the final response body
 */

import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { isLightningNetwork, isValidBolt11Invoice } from "../dist/esm/index.js"
import type { ExactLightningPayload } from "../dist/esm/index.js"

// ---------------------------------------------------------------------------
// Configuration — read from environment variables
// ---------------------------------------------------------------------------

const NWC_URL = process.env.NWC_URL;
const RESOURCE_URL = process.env.RESOURCE_URL ?? "https://x402.albylabs.com/demo/quote";

async function main() {
  if (!NWC_URL) {
    console.error(
      [
        "Error: NWC_URL environment variable is required.",
        "",
        "Example:",
        '  NWC_URL="nostr+walletconnect://<pubkey>?relay=wss://relay.example.com&secret=<secret>" \\',
        "  npx tsx example.ts",
      ].join("\n"),
    );
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Build the x402 client
  // -------------------------------------------------------------------------

  const lightningScheme = new ExactLightningScheme(NWC_URL);

  const client = new x402Client();
  client.register("lightning:*", lightningScheme);

  // -------------------------------------------------------------------------
  // Wrap the global fetch with x402 payment handling
  // -------------------------------------------------------------------------

  // wrapFetchWithPayment returns a drop-in replacement for fetch that:
  //  1. Sends the original request
  //  2. On 402 — parses the payment requirements, pays the invoice,
  //     and retries the request with the payment proof (preimage) attached
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  // -------------------------------------------------------------------------
  // Make the request
  // -------------------------------------------------------------------------

  console.log(`Requesting: ${RESOURCE_URL}`);
  console.log("(Payment will be made automatically if a 402 is returned)\n");

  try {
    const response = await fetchWithPayment(RESOURCE_URL, { method: "GET" });

    console.log(`Status: ${response.status} ${response.statusText}`);

    // Print any payment receipt header returned by the server
    const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
    if (paymentResponse) {
      console.log("Payment receipt (PAYMENT-RESPONSE header):", paymentResponse);
    }

    // Print the response body
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      console.log("\nResponse body (JSON):");
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log("\nResponse body:");
      console.log(text);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
      // Common failure reasons:
      //   - "Insufficient balance" → top up your wallet
      //   - "reply timeout"        → relay unreachable, check NWC_URL
      //   - "No client registered" → server uses a network other than bip122:*
      //   - "Invalid NWC"          → malformed NWC_URL
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

main();
