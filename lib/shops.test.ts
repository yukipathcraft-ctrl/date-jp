import { describe, expect, it } from "vitest";
import { budgetFromRange, budgetFromText, mergeShops, pickSamples, smokeFriendly, smokingFromText, type Shop } from "./shops";

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

describe("mergeShops", () => {
  const shop = (id: string) => ({ id }) as Shop;
  it("場所ごとのお店を交互に並べ、同じお店は1回だけにする", () => {
    const merged = mergeShops([[shop("a1"), shop("x"), shop("a3")], [shop("b1"), shop("x")]], 10);
    expect(merged.map((s) => s.id)).toEqual(["a1", "b1", "x", "a3"]);
  });
  it("上限で切る", () => {
    expect(mergeShops([[shop("a1"), shop("a2")], [shop("b1")]], 2).map((s) => s.id)).toEqual(["a1", "b1"]);
  });
});

describe("smokingFromText", () => {
  it("ホットペッパーの禁煙・喫煙の欄を読む", () => {
    expect(smokingFromText("全面禁煙")).toBe("no");
    expect(smokingFromText("一部禁煙")).toBe("partial");
    expect(smokingFromText("禁煙席なし")).toBe("ok");
    expect(smokingFromText(undefined)).toBeNull();
  });
});

describe("pickSamples のタバコの条件", () => {
  const q = { area: "station" as const, budget: null, size: 2 };
  it("only なら吸えるお店だけ", () => {
    expect(pickSamples({ ...q, smoking: "only" }, 10).shops.every(smokeFriendly)).toBe(true);
  });
  it("prefer なら吸えるお店を先に出す", () => {
    expect(smokeFriendly(pickSamples({ ...q, smoking: "prefer" }, 10).shops[0])).toBe(true);
  });
});
