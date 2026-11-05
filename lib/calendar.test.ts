import { describe, expect, it } from "vitest";
import { googleCalendarUrl, icsContent } from "./calendar";

const event = { title: "ゼミの忘年会", date: "2026-11-13", start: 19 * 60, location: "肉汁餃子のダンダダン 仙台西口店", url: "https://date-jp.vercel.app/p/abc" };

describe("googleCalendarUrl", () => {
  it("日本時間の19時からの2時間を、UTC にして入れる", () => {
    const u = new URL(googleCalendarUrl(event));
    expect(u.searchParams.get("dates")).toBe("20261113T100000Z/20261113T120000Z");
    expect(u.searchParams.get("text")).toBe("ゼミの忘年会");
    expect(u.searchParams.get("location")).toBe("肉汁餃子のダンダダン 仙台西口店");
  });
  it("深夜をまたぐ時刻も、日付を進めて入れる", () => {
    const u = new URL(googleCalendarUrl({ ...event, start: 23 * 60 }));
    expect(u.searchParams.get("dates")).toBe("20261113T140000Z/20261113T160000Z");
  });
  it("お店がなければ場所を入れない", () => {
    expect(new URL(googleCalendarUrl({ ...event, location: null })).searchParams.has("location")).toBe(false);
  });
});

describe("icsContent", () => {
  const ics = icsContent(event, "abc@date", new Date("2026-11-06T00:00:00Z"));
  it("開始と終わりと、前日のお知らせを入れる", () => {
    expect(ics).toContain("DTSTART:20261113T100000Z");
    expect(ics).toContain("DTEND:20261113T120000Z");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
  it("記号は逃がす", () => {
    expect(icsContent({ ...event, title: "a,b;c" }, "x")).toContain("SUMMARY:a\\,b\\;c");
  });
});
