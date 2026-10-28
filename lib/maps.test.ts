import { expect, it } from "vitest";
import { mapsUrl } from "./maps";

it("お店の名前に「仙台」を足して、Google マップの検索に渡す", () => {
  expect(mapsUrl("有頂天")).toBe("https://www.google.com/maps/search/?api=1&query=%E6%9C%89%E9%A0%82%E5%A4%A9%20%E4%BB%99%E5%8F%B0");
});
