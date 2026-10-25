import { describe, expect, it } from "vitest";
import { splitBill } from "./split";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("splitBill", () => {
  it("同じ重みなら均等。端数は幹事が受け持つ", () => {
    const r = splitBill({ total: 10000, weights: [10, 10, 10], unit: 100, organizer: 0 });
    expect(r.amounts).toEqual([3400, 3300, 3300]);
    expect(sum(r.amounts)).toBe(10000);
    expect(r.organizerDiff).toBe(67);
  });

  it("重みに比べて割る", () => {
    // 13 + 10 + 7 = 30。30000円なら 13000 / 10000 / 7000
    const r = splitBill({ total: 30000, weights: [13, 10, 7], unit: 100, organizer: 1 });
    expect(r.amounts).toEqual([13000, 10000, 7000]);
    expect(r.organizerDiff).toBe(0);
  });

  it("合計はいつも一致し、幹事以外は単位にそろう", () => {
    for (const unit of [10, 100, 500]) {
      const r = splitBill({ total: 23456, weights: [15, 12, 10, 7, 7], unit, organizer: 2 });
      expect(sum(r.amounts)).toBe(23456);
      r.amounts.forEach((a, i) => {
        if (i !== 2) expect(a % unit).toBe(0);
      });
    }
  });

  it("幹事の額がマイナスになるなら、ほかの人を切り捨てる", () => {
    // 1000円を 500円単位で4人。四捨五入だと 3人×500 = 1500 で幹事が -500 になる
    const r = splitBill({ total: 1000, weights: [10, 10, 10, 10], unit: 500, organizer: 0 });
    expect(r.amounts).toEqual([1000, 0, 0, 0]);
    expect(r.amounts.every((a) => a >= 0)).toBe(true);
  });

  it("合計が0や人がいなければ0", () => {
    expect(splitBill({ total: 0, weights: [10, 10], unit: 100, organizer: 0 }).amounts).toEqual([0, 0]);
    expect(splitBill({ total: 5000, weights: [], unit: 100, organizer: 0 }).amounts).toEqual([]);
  });
});
