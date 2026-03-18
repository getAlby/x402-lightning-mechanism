import { NWCClient } from "@getalby/sdk/nwc";
import { Invoice } from "@getalby/lightning-tools/bolt11";
import { SUPPORTED_X402_VERSION } from "../../constants";
import { isLightningNetwork } from "../../utils";
import type { ExactLightningPayload } from "../../types";
import type { PaymentPayload, PaymentRequirements, SchemeNetworkClient } from "@x402/core/types";

/**
 * Lightning Network client implementation for the Exact payment scheme using NWC.
 *
 * Pays a BOLT11 invoice via Nostr Wallet Connect (NWC) and returns the payment
 * preimage as cryptographic proof of settlement.
 *
 * @example
 * ```typescript
 * import { x402Client } from "@x402/core/client";
 * import { ExactLightningScheme } from "@x402/lightning/exact/client";
 *
 * const nwcUrl = "nostr+walletconnect://...";
 * const client = new x402Client().register(
 *   "lightning:*",
 *   new ExactLightningScheme(nwcUrl),
 * );
 * ```
 */
export class ExactLightningScheme implements SchemeNetworkClient {
  readonly scheme = "exact";

  private readonly nwcUrl: string;

  /**
   * Creates a new ExactLightningScheme client instance.
   *
   * @param nwcUrl - NWC connection string (`nostr+walletconnect://...`) used to
   *   authenticate with a Lightning wallet for making payments.
   */
  constructor(nwcUrl: string) {
    if (!nwcUrl || !nwcUrl.startsWith("nostr+walletconnect://")) {
      throw new Error(
        "Invalid NWC connection string. Expected format: nostr+walletconnect://<walletPubkey>?relay=<url>&secret=<secret>",
      );
    }
    this.nwcUrl = nwcUrl;
  }

  /**
   * Creates a Lightning payment payload by paying the BOLT11 invoice embedded
   * in the payment requirements via NWC.
   *
   * The facilitator is expected to have pre-generated a BOLT11 invoice and placed
   * it in `paymentRequirements.extra.invoice`. The client pays that invoice and
   * returns the preimage as proof.
   *
   * @param x402Version - The x402 protocol version
   * @param paymentRequirements - Payment requirements containing the BOLT11 invoice
   *   in `extra.invoice`
   * @returns Promise resolving to a payment payload containing the preimage and
   *   payment hash
   * @throws {Error} If the payment requirements are invalid or the payment fails
   */
  async createPaymentPayload(
    x402Version: number,
    paymentRequirements: PaymentRequirements,
  ): Promise<Pick<PaymentPayload, "x402Version" | "payload">> {
    this.validatePaymentRequirements(paymentRequirements);

    const invoice = paymentRequirements.extra.invoice as string;

    const nwcClient = new NWCClient({ nostrWalletConnectUrl: this.nwcUrl });
    try {
      const response = await nwcClient.payInvoice({ invoice });

      const payload: ExactLightningPayload = {
        preimage: response.preimage,
      };

      return {
        x402Version,
        payload: payload as unknown as Record<string, unknown>,
      };
    } finally {
      nwcClient.close();
    }
  }

  /**
   * Validates that the payment requirements are suitable for a Lightning payment.
   *
   * @param requirements - The payment requirements to validate
   * @throws {Error} If any required field is missing or invalid
   */
  private validatePaymentRequirements(requirements: PaymentRequirements): void {
    const { scheme, network, extra } = requirements;

    if (scheme !== "exact") {
      throw new Error(`Unsupported scheme: ${scheme}. Expected "exact".`);
    }

    if (!isLightningNetwork(network)) {
      throw new Error(`Unsupported Lightning network: ${network}`);
    }
    const invoice = new Invoice({ pr: extra.invoice as string });

    if (invoice.satoshi.toString() != requirements.amount) {
      throw new Error(
        `Invalid amount: ${invoice.satoshi}. expected ${requirements.amount}`
      );
    }
  }
}
