import { describe, expect, it } from "vitest";
import { assignSeats, parseNames, seatsText, type Person } from "./seats";

const people = (names: string[]): Person[] => names.map((name) => ({ name }));

describe("parseNames", () => {
  it("1行1人にして、空の行と空白を除く", () => {
    expect(parseNames(" 山田\n\n佐藤 \r\n鈴木\n")).toEqual(["山田", "佐藤", "鈴木"]);
  });
});

describe("assignSeats", () => {
  const names = ["a", "b", "c", "d", "e", "f", "g"];

  it("全員がちょうど1回ずつ入り、人数の差は1人まで", () => {
    const r = assignSeats(people(names), 3);
    expect(r.flat().map((p) => p.name).sort()).toEqual([...names].sort());
    const sizes = r.map((t) => t.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("テーブルが人数より多ければ、人数にそろえる", () => {
    expect(assignSeats(people(["a", "b"]), 5)).toHaveLength(2);
  });

  it("主役は1卓目から順に、最初の席に入る", () => {
    for (let k = 0; k < 20; k++) {
      const r = assignSeats([...people(names), { name: "x", honored: true }, { name: "y", honored: true }], 3);
      expect(r[0][0].honored && r[1][0].honored).toBe(true);
      expect(r[2].some((p) => p.honored)).toBe(false);
    }
  });

  it("同じグループの人は別のテーブルに散る", () => {
    const ps: Person[] = [
      ...["a1", "a2", "a3"].map((name) => ({ name, group: "A" })),
      ...["b1", "b2", "b3"].map((name) => ({ name, group: "B" })),
    ];
    for (let k = 0; k < 20; k++) {
      const r = assignSeats(ps, 3);
      r.forEach((t) => {
        expect(t.filter((p) => p.group === "A")).toHaveLength(1);
        expect(t.filter((p) => p.group === "B")).toHaveLength(1);
      });
    }
  });
});

describe("seatsText", () => {
  it("卓ごとに1行で、主役に★を付ける", () => {
    expect(seatsText([[{ name: "山田", honored: true }, { name: "佐藤" }], [{ name: "鈴木" }]])).toBe(
      "席決めの結果です\n1卓: ★山田、佐藤\n2卓: 鈴木",
    );
  });
});
