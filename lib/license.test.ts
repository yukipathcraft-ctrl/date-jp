import { describe, expect, it } from "vitest";
import { signLicense, verifyLicense } from "./license";

describe("license", () => {
  const key = signLicense("cs_test_abc123", "secret");
  it("同じ秘密で作った鍵は通る", () => {
    expect(verifyLicense(key, "secret")).toBe(true);
  });
  it("秘密がちがう、または書き換えた鍵は通らない", () => {
    expect(verifyLicense(key, "other")).toBe(false);
    expect(verifyLicense(key.replace("abc123", "abc124"), "secret")).toBe(false);
    expect(verifyLicense(key + "x", "secret")).toBe(false);
  });
  it("形がおかしいものは通らない", () => {
    expect(verifyLicense("", "secret")).toBe(false);
    expect(verifyLicense("nope", "secret")).toBe(false);
    expect(verifyLicense(null, "secret")).toBe(false);
    expect(verifyLicense("cs_x.", "secret")).toBe(false);
  });
});
