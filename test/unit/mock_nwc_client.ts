import {
  Nip47GetBalanceResponse,
  Nip47GetInfoResponse,
  Nip47MakeInvoiceRequest,
  Nip47PayInvoiceRequest,
  Nip47PayResponse,
  Nip47Transaction,
} from "@getalby/sdk/types";

type MockCall<TArgs, TResult> = {
  args: TArgs;
  result: TResult;
};

export class MockNWCClient {
  calls: {
    payInvoice: MockCall<Nip47PayInvoiceRequest, Nip47PayResponse>[];
    makeInvoice: MockCall<Nip47MakeInvoiceRequest, Nip47Transaction>[];
    getBalance: MockCall<undefined, Nip47GetBalanceResponse>[];
    getInfo: MockCall<undefined, Nip47GetInfoResponse>[];
  } = {
    payInvoice: [],
    makeInvoice: [],
    getBalance: [],
    getInfo: [],
  };

  static readonly mockResponse = {
    payInvoice: {
      preimage:
        "b6f1086f61561bacf2f05fa02ab30a06c3432c1aea62817c019ea33c1730eeb",
      fees_paid: 1,
    } satisfies Nip47PayResponse,

    makeInvoice: {
      type: "incoming",
      state: "pending",
      invoice:
        "lnbc10n1pjyz5u5pp58d80nfqj5nf5ywqrvjakr5xfn8hfkpkf0b4sn8gre7t7fdfl20sdq2gdhkven9v5cqzpgxqyz5vqsp5usyc4lk9chsfp53kvcnvq456ganh60d89reykdngsmtj6yw3nhvq9qyyssqzex47pzfw2ge06jy3xc7lcdhs7hdcz75m4m47pd3d8uc98aqy97h8rxlzwkfpnylmz77ytmpn4lgcxsp86vhpfkdnkp0m0j0dyf2u3cq5xyv7q",
      description: "Test invoice",
      description_hash: "",
      preimage: "",
      payment_hash:
        "38fbe8941559a4b18c06319d5a3496f3aeab05a5cf4987464718abfd926b57e0",
      amount: 1000,
      fees_paid: 0,
      settled_at: 0,
      created_at: 1722000000,
      expires_at: 1722003600,
    } satisfies Nip47Transaction,

    getBalance: {
      balance: 100000,
    } satisfies Nip47GetBalanceResponse,

    getInfo: {
      alias: "mock-wallet",
      color: "#ffffff",
      pubkey:
        "b6f1086f61561bacf2f05fa02ab30a06c3432c1aea62817c019ea33c1730eeb3",
      network: "mainnet",
      block_height: 800000,
      block_hash:
        "000000000000000000013d3a0e7b3c7e8e6c3b1a2d3e4f5a6b7c8d9e0f1a2b3",
      methods: [
        "pay_invoice",
        "make_invoice",
        "get_balance",
        "get_info",
        "get_budget",
        "list_transactions",
        "lookup_invoice",
      ],
      notifications: ["payment_received", "payment_sent"],
    } satisfies Nip47GetInfoResponse,
  } as const;

  async payInvoice(
    request: Nip47PayInvoiceRequest,
  ): Promise<Nip47PayResponse> {
    const result = MockNWCClient.mockResponse.payInvoice;
    this.calls.payInvoice.push({ args: request, result });
    return result;
  }

  async makeInvoice(
    request: Nip47MakeInvoiceRequest,
  ): Promise<Nip47Transaction> {
    const result = {
      ...MockNWCClient.mockResponse.makeInvoice,
      amount: request.amount,
      description: request.description ?? "",
    };
    this.calls.makeInvoice.push({ args: request, result });
    return result;
  }

  async getBalance(): Promise<Nip47GetBalanceResponse> {
    const result = MockNWCClient.mockResponse.getBalance;
    this.calls.getBalance.push({ args: undefined, result });
    return result;
  }

  async getInfo(): Promise<Nip47GetInfoResponse> {
    const result = MockNWCClient.mockResponse.getInfo;
    this.calls.getInfo.push({ args: undefined, result });
    return result;
  }
}
