import { describe, expect, it } from "vitest";
import { isStation, meetingStation, normalizeStationQuery, stationVotes, type Station } from "./stations";

const sendai: Station = { name: "仙台", pref: "宮城県", lat: 38.260027, lng: 140.882158 };
const nagamachi: Station = { name: "長町", pref: "宮城県", lat: 38.226, lng: 140.886 };
const izumi: Station = { name: "泉中央", pref: "宮城県", lat: 38.3233, lng: 140.8812 };
const shibuya: Station = { name: "渋谷", pref: "東京都", lat: 35.658871, lng: 139.701238 };

describe("normalizeStationQuery", () => {
  it("最後の「駅」と空白を取る", () => {
    expect(normalizeStationQuery(" 仙台駅 ")).toBe("仙台");
    expect(normalizeStationQuery("駅前")).toBe("駅前");
  });
});

describe("isStation", () => {
  it("日本の中の駅だけを受け付ける", () => {
    expect(isStation(sendai)).toBe(true);
    expect(isStation({ ...sendai, lat: 0 })).toBe(false);
    expect(isStation({ name: "", pref: "", lat: 38, lng: 140 })).toBe(false);
    expect(isStation(null)).toBe(false);
  });
});

describe("meetingStation", () => {
  it("誰も選んでいなければ null", () => {
    expect(meetingStation([])).toBeNull();
  });
  it("北と南の人がいれば、真ん中の駅を選ぶ", () => {
    expect(meetingStation([izumi, nagamachi, sendai])).toEqual(sendai);
  });
  it("同じ駅を選んだ人が多ければ、その駅", () => {
    expect(meetingStation([shibuya, shibuya, sendai])).toEqual(shibuya);
  });
});

describe("stationVotes", () => {
  it("駅ごとの人数を多い順に", () => {
    expect(stationVotes([sendai, nagamachi, sendai]).map((v) => [v.station.name, v.votes])).toEqual([
      ["仙台", 2],
      ["長町", 1],
    ]);
  });
});
