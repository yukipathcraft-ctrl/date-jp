import { describe, expect, it } from "vitest";
import { countAds } from "./store/stats";
import { activeSponsors, findSponsor, sponsorFor } from "./sponsors";

describe("sponsors", () => {
  it("社会人の会には贈りものと帰りの足、学生の会には二次会と自動車学校を出す", () => {
    expect(sponsorFor("gift", "worker")?.audience).toBe("worker");
    expect(sponsorFor("ride", "worker")?.audience).toBe("worker");
    expect(sponsorFor("second", "student")?.audience).toBe("student");
    expect(sponsorFor("campus", "student")?.audience).toBe("student");
    expect(sponsorFor("ride", "student")).toBeNull();
    expect(sponsorFor("campus", "worker")).toBeNull();
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
