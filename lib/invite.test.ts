import { describe, expect, it } from "vitest";
import { monthInJapan, nextOccasion } from "./invite";

describe("nextOccasion", () => {
  it("年末は忘年会、年明けは新年会", () => {
    expect(nextOccasion(11, "worker")).toBe("忘年会");
    expect(nextOccasion(12, "student")).toBe("忘年会");
    expect(nextOccasion(1, "worker")).toBe("新年会");
  });
  it("春は学生と社会人で呼び方を変える", () => {
    expect(nextOccasion(3, "student")).toBe("追いコン");
    expect(nextOccasion(3, "worker")).toBe("送別会");
    expect(nextOccasion(4, "student")).toBe("新歓");
    expect(nextOccasion(4, "worker")).toBe("歓迎会");
  });
  it("ほかの月は「次の飲み会」", () => {
    expect(nextOccasion(8, "student")).toBe("次の飲み会");
  });
});

describe("monthInJapan", () => {
  it("日本時間で月をまたぐ", () => {
    // 10/31 15:00 UTC は 日本時間で 11/1 0:00
    expect(monthInJapan(new Date("2026-10-31T15:00:00Z"))).toBe(11);
    expect(monthInJapan(new Date("2026-10-31T14:59:00Z"))).toBe(10);
  });
});
