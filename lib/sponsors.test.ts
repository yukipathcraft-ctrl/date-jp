import { describe, expect, it } from "vitest";
import { countAds } from "./store/stats";
import { activeSponsors, findSponsor, sponsorFor } from "./sponsors";

describe("sponsors", () => {
  it("開発中は見本の広告が二次会と帰りに1つずつ出る", () => {
    expect(sponsorFor("second")?.placement).toBe("second");
    expect(sponsorFor("ride")?.placement).toBe("ride");
  });
  it("載せていない id では見つからない(外の URL には飛ばさない)", () => {
    expect(findSponsor("https://evil.example.com")).toBeNull();
  });
  it("期間が過ぎた広告は出さない", () => {
    expect(activeSponsors(new Date("2026-10-27T00:00:00Z")).every((s) => !s.until || s.until >= "2026-10-27")).toBe(true);
  });
});

describe("countAds", () => {
  it("広告ごとに見られた数と押された数を数える", () => {
    expect(
      countAds([
        { sponsorId: "a", kind: "view" },
        { sponsorId: "a", kind: "view" },
        { sponsorId: "a", kind: "click" },
        { sponsorId: "b", kind: "view" },
      ]),
    ).toEqual([
      { sponsorId: "a", views: 2, clicks: 1 },
      { sponsorId: "b", views: 1, clicks: 0 },
    ]);
  });
});
