import { describe, it, expect } from "vitest";
import {
  isLightningNetwork,
} from "../../src/utils";
import {
  LIGHTNING_MAINNET_CAIP2,
  LIGHTNING_TESTNET_CAIP2,
} from "../../src/constants";

describe("isLightningNetwork", () => {
  it("returns true for mainnet", () => {
    expect(isLightningNetwork(LIGHTNING_MAINNET_CAIP2)).toBe(true);
  });

  it("returns true for testnet", () => {
    expect(isLightningNetwork(LIGHTNING_TESTNET_CAIP2)).toBe(true);
  });

  it("returns false for EVM network", () => {
    expect(isLightningNetwork("eip155:1")).toBe(false);
  });

  it("returns false for Stellar network", () => {
    expect(isLightningNetwork("stellar:pubnet")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isLightningNetwork("")).toBe(false);
  });

  it("returns false for an arbitrary string", () => {
    expect(isLightningNetwork("bip122:deadbeef")).toBe(false);
  });
});
