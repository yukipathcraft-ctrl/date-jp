import { describe, expect, it } from "vitest";
import { countShops } from "./stats";

describe("countShops", () => {
  it("押された数の多い順に並べる", () => {
    expect(countShops(["a", "b", "a", "c", "a", "b"])).toEqual([
      { shopId: "a", count: 3 },
      { shopId: "b", count: 2 },
      { shopId: "c", count: 1 },
    ]);
  });
  it("10件までにする", () => {
    expect(countShops(Array.from({ length: 15 }, (_, i) => `s${i}`))).toHaveLength(10);
  });
});
