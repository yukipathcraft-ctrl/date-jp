import { describe, expect, it } from "vitest";
import { budgetFromText } from "./shops";

describe("budgetFromText", () => {
  it("予算の目安の文から額を読む", () => {
    expect(budgetFromText("12,000円")).toBe(12000);
    expect(budgetFromText("7000円～８０００円")).toBe(7000);
  });
  it("昼と夜があれば夜の額を読む", () => {
    expect(budgetFromText("昼750円／夜1000円")).toBe(1000);
    expect(budgetFromText("昼：1501～2000円/夜：4001～5000円")).toBe(4001);
  });
  it("読めなければ0", () => {
    expect(budgetFromText(undefined)).toBe(0);
    expect(budgetFromText("お問い合わせください")).toBe(0);
  });
});
