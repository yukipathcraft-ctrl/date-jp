import { describe, expect, it } from "vitest";
import { accessHint, mapsUrl } from "./maps";

describe("mapsUrl", () => {
  it("お店の名前で Google マップを探す", () => {
    expect(mapsUrl("有頂天")).toBe("https://www.google.com/maps/search/?api=1&query=%E6%9C%89%E9%A0%82%E5%A4%A9");
  });
  it("手がかりがあれば添える", () => {
    expect(mapsUrl("有頂天", "渋谷駅")).toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("有頂天 渋谷駅")}`);
  });
});

describe("accessHint", () => {
  it("行き方から最初の駅を取り出す", () => {
    expect(accessHint("仙台駅[北出口6]から徒歩1分/あおば通駅から徒歩3分")).toBe("仙台駅");
    expect(accessHint("JR渋谷駅ハチ公口 徒歩3分")).toBe("JR渋谷駅");
    expect(accessHint("国分町通り")).toBeNull();
    expect(accessHint(null)).toBeNull();
  });
});
