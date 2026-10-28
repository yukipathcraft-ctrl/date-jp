import { describe, expect, it } from "vitest";
import { PRIOR, countLabel, isHighlyRated, scoreOf, weightedScore } from "./rating";

describe("weightedScore", () => {
  it("口コミが少ない高い★より、口コミが多いやや高い★のほうが上になる", () => {
    const few = weightedScore(4.9, 5);
    const many = weightedScore(4.2, 800);
    expect(many).toBeGreaterThan(few);
  });

  it("口コミが0件なら平均そのもの、とても多ければ元の★に近づく", () => {
    expect(weightedScore(5, 0)).toBe(PRIOR);
    expect(weightedScore(4.5, 10000)).toBeCloseTo(4.5, 1);
  });

  it("小数第2位までにする", () => {
    expect(weightedScore(4.4, 30)).toBe(4.05);
  });
});

describe("isHighlyRated", () => {
  it("点が4.0以上なら評価が高い", () => {
    expect(isHighlyRated({ score: 4.0 })).toBe(true);
    expect(isHighlyRated({ score: 3.99 })).toBe(false);
  });
  it("★5でも口コミが3件なら、評価が高いとはしない", () => {
    expect(isHighlyRated({ score: weightedScore(5, 3) })).toBe(false);
  });
});

it("評価のないお店は平均として扱う", () => {
  expect(scoreOf(null)).toBe(PRIOR);
});

it("口コミの数は3桁ごとに区切る", () => {
  expect(countLabel(1234)).toBe("1,234件");
});
