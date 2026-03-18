import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PaymentRequirements } from "@x402/core/types";
import { MockNWCClient } from "./mock_nwc_client";

import { ExactLightningScheme } from "../../src/exact/client/scheme";
import {
  LIGHTNING_MAINNET_CAIP2,
  LIGHTNING_TESTNET_CAIP2,
  SUPPORTED_X402_VERSION,
} from "../../src/constants";
;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const VALID_NWC_URL =
  "nostr+walletconnect://walletpubkey123?relay=wss://relay.example.com&secret=abc123secret";

const VALID_INVOICE =
  "lnbc4020n1p5m4x6tdq50q6rqv3dd9h8vmmfvdjsnp4qt5w34u6kntf5lc50jj27rvs89sgrpcpj7s6vfts042gkhxx2j6swpp5t5gtvespkfmad6epsfa54wnqpjj77gy8egx2esgjzxtuskr9jxlssp5tx35qyr2zj4pd9jglxpgu3skes3n8wc37e60qxhxhmg6d6wd7n3q9qyysgqcqzp2xqyz5vqrzjq26922n6s5n5undqrf78rjjhgpcczafws45tx8237y7pzx3fg8ww8apyqqqqqqqqjyqqqqlgqqqqr4gq2qrzjqdc22wfv6lyplagj37n9dmndkrzdz8rh3lxkewvvk6arkjpefats2rf47yqqwysqqcqqqqlgqqqqqqgqfqv9f4cwvwaycdpq24gtwy4e5zv6hultjhmr8cvptrzqqed996jkjk5vlavwzk9tvlvy3c7nw9fzq9gdmp2gx2ze6gahvcrkhu6lv87zsp7z0l6t";

/** Builds a minimal valid PaymentRequirements object for Lightning. */
function buildRequirements(overrides: Partial<PaymentRequirements> = {}): PaymentRequirements {
  return {
    scheme: "exact",
    network: LIGHTNING_MAINNET_CAIP2,
    asset: "sat",
    amount: "402",
    payTo: "alice@getalby.com",
    maxTimeoutSeconds: 60,
    extra: {
      invoice: VALID_INVOICE,
    },
    ...overrides,
  };
}

function buildMockNwcClient() {
  return new MockNWCClient();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ExactLightningScheme (client)", () => {

  describe("createPaymentPayload — validation", () => {

    it("throws when scheme is not 'exact'", async () => {
      const scheme = new ExactLightningScheme({ nwcClient: buildMockNwcClient() });
      const requirements = buildRequirements({ scheme: "streaming" });
      await expect(
        scheme.createPaymentPayload(SUPPORTED_X402_VERSION, requirements),
      ).rejects.toThrow(/unsupported scheme/i);
    });

    it("throws for an unsupported network", async () => {
      const scheme = new ExactLightningScheme({ nwcClient: buildMockNwcClient() });
      const requirements = buildRequirements({ network: "eip155:1" });
      await expect(
        scheme.createPaymentPayload(SUPPORTED_X402_VERSION, requirements),
      ).rejects.toThrow(/unsupported lightning network/i);
    });

    it("throws when extra.invoice is missing", async () => {
      const scheme = new ExactLightningScheme({ nwcClient: buildMockNwcClient() });
      const requirements = buildRequirements({ extra: {} });
      await expect(
        scheme.createPaymentPayload(SUPPORTED_X402_VERSION, requirements),
      ).rejects.toThrow(/Invalid payment request/i);
    });

    it("throws when extra.invoice is not a string", async () => {
      const scheme = new ExactLightningScheme({ nwcClient: buildMockNwcClient() });
      const requirements = buildRequirements({ extra: { invoice: 12345 } });
      await expect(
        scheme.createPaymentPayload(SUPPORTED_X402_VERSION, requirements),
      ).rejects.toThrow(/Failed to decode payment request/i);
    });

    it("throws when extra.invoice is an invalid BOLT11 string", async () => {
      const scheme = new ExactLightningScheme({ nwcClient: buildMockNwcClient() });
      const requirements = buildRequirements({ extra: { invoice: "not-an-invoice" } });
      await expect(
        scheme.createPaymentPayload(SUPPORTED_X402_VERSION, requirements),
      ).rejects.toThrow(/Failed to decode payment request/i);
    });

    it("throws when extra.invoice is of an unexpected amount", async () => {
      const scheme = new ExactLightningScheme({ nwcClient: buildMockNwcClient() });
      const requirements = buildRequirements({ amount: "100" });
      await expect(
        scheme.createPaymentPayload(SUPPORTED_X402_VERSION, requirements),
      ).rejects.toThrow(/Invalid amount: 402. expected 100/i);
    });

  });

  // -------------------------------------------------------------------------
  // createPaymentPayload — happy path
  // -------------------------------------------------------------------------

  describe("createPaymentPayload — happy path", () => {

    it("returns the correct x402Version", async () => {
      const scheme = new ExactLightningScheme({ nwcClient: buildMockNwcClient() });
      const result = await scheme.createPaymentPayload(SUPPORTED_X402_VERSION, buildRequirements());
      expect(result.x402Version).toBe(SUPPORTED_X402_VERSION);
    });

    it("includes the preimage in the payload", async () => {
      const nwcClient = buildMockNwcClient();
      const scheme = new ExactLightningScheme({ nwcClient: nwcClient });
      const result = await scheme.createPaymentPayload(SUPPORTED_X402_VERSION, buildRequirements());
      const payload = result.payload as { preimage: string };
      expect(payload.preimage).toBe(nwcClient.calls.payInvoice[0].result.preimage);
    });

    it("calls NWCClient.payInvoice with the invoice from extra", async () => {
      const nwcClient = buildMockNwcClient();
      const scheme = new ExactLightningScheme({ nwcClient: nwcClient });
      const requirements = buildRequirements();
      await scheme.createPaymentPayload(SUPPORTED_X402_VERSION, requirements);

      expect(nwcClient.calls.payInvoice[0].args.invoice).toBe(VALID_INVOICE);
    });

  });

});
