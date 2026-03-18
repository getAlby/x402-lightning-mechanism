
import { Invoice } from "@getalby/lightning-tools/bolt11";
import { SUPPORTED_X402_VERSION } from "../../constants";
import { isLightningNetwork } from "../../utils";
import type { ExactLightningPayload, Wallet } from "../../types";
import type { PaymentPayload, PaymentRequirements, SchemeNetworkClient } from "@x402/core/types";


/**
 * Lightning Network client implementation for the Exact payment scheme using NWC.
 *
 * Pays a BOLT11 invoice via Nostr Wallet Connect (NWC) and returns the payment
 * preimage as cryptographic proof of settlement.
 *
 * @example
 * ```typescript
 * import { NWCClient } from "@getalby/sdk/nwc";
 * import { x402Client } from "@x402/core/client";
 * import { ExactLightningScheme } from "@x402/lightning/exact/client";
 *
 * const nwcClient = new NWCClient({ nostrWalletConnectUrl: "nostr+walletconnect://..." });
 * const client = new x402Client().register(
 *   "lightning:*",
 *   new ExactLightningScheme({ nwcClient }),
 * );
 * ```
 */
export class ExactLightningScheme implements SchemeNetworkClient {
  readonly scheme = "exact";

  private readonly nwcClient: Wallet;

  /**
   * Creates a new ExactLightningScheme client instance.
   *
   * @param options - Configuration options.
   * @param options.nwcClient - Any object implementing {@link Wallet}
   *   (e.g. an `NWCClient` instance). The caller is responsible for managing
   *   the client's lifecycle (e.g. calling `close()` when done).
   */
  constructor({ nwcClient }: { nwcClient: Wallet }) {
    this.nwcClient = nwcClient;
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

    const response = await this.nwcClient.payInvoice({ invoice });

    const payload: ExactLightningPayload = {
      preimage: response.preimage,
    };

    return {
      x402Version,
      payload: payload as unknown as Record<string, unknown>,
    };
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
