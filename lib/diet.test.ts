import { describe, expect, it } from "vitest";
import { dietNotice, summarizeDiet } from "./diet";

describe("summarizeDiet", () => {
  it("苦手なものを人数で数え、名前は持たない", () => {
    const d = summarizeDiet([
      { avoids: ["shrimp"], drinks: false },
      { avoids: ["shrimp", "raw"] },
      { drinks: true },
    ]);
    expect(d.avoids).toEqual([
      { key: "shrimp", label: "えび・かに", count: 2 },
      { key: "raw", label: "生もの", count: 1 },
    ]);
    expect(d.nonDrinkers).toBe(1);
  });
  it("前の答え(お酒の項目がない)は飲むとみなす", () => {
    expect(summarizeDiet([{}, {}]).nonDrinkers).toBe(0);
    expect(summarizeDiet([{ smokes: true }, {}, { smokes: true }]).smokers).toBe(2);
  });
});

describe("dietNotice", () => {
  it("お店に伝える一言にする", () => {
    expect(dietNotice({ avoids: [{ key: "soba", label: "そば", count: 1 }], nonDrinkers: 2, smokers: 0, others: ["パクチー"] })).toBe(
      "そばが苦手な人が1人・そのほか苦手なもの(パクチー)・お酒を飲まない人が2人",
    );
    expect(dietNotice({ avoids: [], nonDrinkers: 0, smokers: 0, others: [] })).toBeNull();
  });
  it("タバコを吸う人がいれば、お店に伝える", () => {
    expect(dietNotice({ avoids: [], nonDrinkers: 0, smokers: 2, others: [] })).toBe("タバコを吸う人が2人(喫煙できる席を希望)");
  });
});
