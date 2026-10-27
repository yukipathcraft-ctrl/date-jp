import { describe, expect, it } from "vitest";
import { assignSeats, parseNames, seatsText } from "./seats";

describe("parseNames", () => {
  it("1行1人にして、空の行と空白を除く", () => {
    expect(parseNames(" 山田\n\n佐藤 \r\n鈴木\n")).toEqual(["山田", "佐藤", "鈴木"]);
  });
});

describe("assignSeats", () => {
  const names = ["a", "b", "c", "d", "e", "f", "g"];

  it("全員がちょうど1回ずつ入り、人数の差は1人まで", () => {
    const r = assignSeats(names, 3);
    expect(r.flat().sort()).toEqual([...names].sort());
    const sizes = r.map((t) => t.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("テーブルが人数より多ければ、人数にそろえる", () => {
    expect(assignSeats(["a", "b"], 5)).toHaveLength(2);
  });

  it("同じくじなら同じ結果になる", () => {
    const rand = () => 0.5;
    expect(assignSeats(names, 2, rand)).toEqual(assignSeats(names, 2, rand));
  });
});

describe("seatsText", () => {
  it("卓ごとに1行", () => {
    expect(seatsText([["山田", "佐藤"], ["鈴木"]])).toBe("席決めの結果です\n1卓: 山田、佐藤\n2卓: 鈴木");
  });
});
