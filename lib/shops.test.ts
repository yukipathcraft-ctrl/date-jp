import { describe, expect, it } from "vitest";
import { budgetFromRange, budgetFromText } from "./shops";

describe("budgetFromRange", () => {
  it("予算の区分名から上限を読む", () => {
    expect(budgetFromRange("5001～6000円")).toBe(6000);
    expect(budgetFromRange("7001～8000円")).toBe(8000);
    expect(budgetFromRange("～500円")).toBe(500);
  });
  it("上限のない区分は無限大", () => {
    expect(budgetFromRange("30001円～")).toBe(Number.POSITIVE_INFINITY);
  });
  it("読めなければ0", () => {
    expect(budgetFromRange(undefined)).toBe(0);
    expect(budgetFromRange("")).toBe(0);
  });
});

describe("budgetFromText", () => {
  it("予算の目安の文から額を読む", () => {
    expect(budgetFromText("12,000円")).toBe(12000);
    expect(budgetFromText("7000円～８０００円")).toBe(7000);
    expect(budgetFromText("5500")).toBe(5500);
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
