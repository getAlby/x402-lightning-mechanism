# @x402/lightning

Lightning Network implementation of the x402 payment protocol using the **Exact** payment scheme with [Nostr Wallet Connect (NWC)](https://nwc.dev).

## Installation

```bash
npm install @x402/lightning
```

## Overview

This package provides three main components for handling x402 payments on the Lightning Network:

- **Client** – For applications that need to make Lightning payments via an NWC-connected wallet
- **TODO: Facilitator** – For payment processors that generate invoices, verify preimage proofs, and confirm settlement
- **TODO: Server** – For resource servers that accept Lightning payments and build payment requirements

**Key Differences from EVM/SVM:**

- **Invoice-based flow** – The facilitator generates a BOLT11 invoice per request; the client pays it and returns the payment preimage as proof
- **Preimage = proof of payment** – SHA-256(preimage) must match the payment hash in the invoice; no on-chain transaction hash is involved
- **NWC for wallet access** – Both client and facilitator communicate with Lightning wallets using the [NWC protocol (NIP-47)](https://github.com/nostr-protocol/nips/blob/master/47.md)
- **No on-chain signing** – There are no on-chain signer addresses;

## Package Exports

### Main Package (`@x402/lightning`)

**V2 Protocol Support** – x402 v2 protocol with CAIP-2 network identifiers (`bip122:*`)

**Client:**

- `ExactLightningScheme` – Client implementation that pays BOLT11 invoices via NWC

**Types:**

- `ExactLightningPayload` – The payment payload shape: `{ preimage: string; paymentHash: string }`
- `LightningPaymentRequirementsExtra` – Extra fields on payment requirements: `{ invoice: string }`
- `NWCConnectionString` – Type alias for a `nostr+walletconnect://...` connection string

### Subpath Exports

- `@x402/lightning/exact/client` – `ExactLightningScheme` (client)

## Supported Networks

**V2 Networks** (via [CAIP-2 / BIP-122](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md)):

| Identifier | Network |
|---|---|
| `lightning:mutinynet"` | Bitcoin Mainnet |
| `lightning:testnet` | Bitcoin Testnet |
| `lightning:mutinynet"` | Bitcoin Mutinynet |

## Asset Support

Lightning payments are denominated in **satoshis** (`sat`) — the smallest indivisible unit of Bitcoin (1 BTC = 100,000,000 sat).

## Payment Flow

```
┌──────────┐      1. POST /resource (no payment)     ┌──────────────┐
│  Client  │ ──────────────────────────────────────> │   Server     │
│          │                                          │              │
│          │ <─────── 402 Payment Required ────────── │              │
│          │        (requirements + invoice)          └───────┬──────┘
│          │                                                  │ generateInvoice()
│          │                                          ┌───────┴──────┐
│          │                                          │  Facilitator │
│          │                                          │     (NWC)    │
│          │                                          └──────────────┘
│          │
│  (NWC)   │  2. pay_invoice via NWC wallet
│          │ ──────────────> Lightning Network ──────> Facilitator wallet
│          │                                             (preimage revealed)
│          │
│          │      3. POST /resource + X-PAYMENT header
│          │         payload: { preimage }
│          │ ──────────────────────────────────────> ┌──────────────┐
│          │                                          │  Facilitator │
│          │                                          │  verify()    │
│          │                                          │  settle()    │
│          │                                          └───────┬──────┘
│          │      4. 200 OK (access granted)                  │
│          │ <─────────────────────────────────────── ────────┘
└──────────┘
```

## Usage Patterns

### 1. Client — Pay with NWC

```typescript
import { x402Client } from "@x402/core/client";
import { ExactLightningScheme } from "@x402/lightning/exact/client";

const nwcUrl = "nostr+walletconnect://..."; // from user's wallet
const client = new x402Client().register("lightning:*", new ExactLightningScheme(nwcUrl));

// The client automatically handles 402 responses
const response = await client.fetch("https://api.example.com/premium/data");
```

## Obtaining an NWC Connection String

Any NWC-compatible wallet can provide a connection string in the format:

```
nostr+walletconnect://<walletPubkey>?relay=<relayUrl>&secret=<secret>
```

Supported wallets include:

- **[Alby Hub](https://albyhub.com)** – Self-hosted Lightning node with NWC
- **[Rizful](https://rizful.com/)** – Custodial wallet with NWC support
- **[coinos](https://coinos.io)** – Custodial wallet with NWC support

> [!WARNING]
> NWC connection strings grant payment permissions to whoever holds them.
> Store them securely (e.g., environment variables) and never commit them to version control.

## Development

```bash
# Build
pnpm build

# Test (unit only)
pnpm test

# Integration tests
pnpm test:integration

# Lint & Format
pnpm lint
pnpm format
```

## Related Packages

- `@x402/core` – Core protocol types and client
- `@x402/fetch` – HTTP wrapper with automatic payment handling
- `@x402/evm` – EVM/Ethereum implementation
- `@x402/svm` – Solana/SVM implementation
- `@x402/stellar` – Stellar/Soroban implementation
