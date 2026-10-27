import { describe, expect, it } from "vitest";
import { inviteText, reminderText, teamsShareUrl } from "./share";

describe("reminderText", () => {
  it("まだの人の名前と金額だけを並べる", () => {
    const text = reminderText("student", "ゼミの打ち上げ", [
      { name: "山田", amount: 3200 },
      { name: "佐藤", amount: 2400 },
    ]);
    expect(text.startsWith("「ゼミの打ち上げ」のお会計、まだの人お願いします\n")).toBe(true);
    expect(text).toContain("・山田さん 3,200円");
    expect(text).toContain("・佐藤さん 2,400円");
  });
  it("社会人向けは丁寧な言い方にし、名前がなければ「先日の会」にする", () => {
    const text = reminderText("worker", "  ", [{ name: "鈴木", amount: 5000 }]);
    expect(text.startsWith("お疲れさまです。\n先日の会のお会計につきまして、お済みでない方はお支払いをお願いいたします。")).toBe(true);
    expect(text).toContain("行き違いでお支払い済みの場合は、ご容赦ください。");
  });
});

describe("teamsShareUrl", () => {
  it("文の中の URL をリンクにし、残りを添える文にする", () => {
    const u = new URL(teamsShareUrl("「歓迎会」の日程調整です\nhttps://date-sendai.vercel.app/p/abc"));
    expect(u.origin + u.pathname).toBe("https://teams.microsoft.com/share");
    expect(u.searchParams.get("href")).toBe("https://date-sendai.vercel.app/p/abc");
    expect(u.searchParams.get("msgText")).toBe("「歓迎会」の日程調整です");
  });
});

describe("inviteText", () => {
  it("幹事が決めた開始時刻を添える", () => {
    expect(inviteText("歓迎会", "https://x", 1140)).toBe("「歓迎会」の日程調整です(19:00〜)\n行ける日を入れてください\nhttps://x");
  });
});
