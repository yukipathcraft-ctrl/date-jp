import { describe, expect, it } from "vitest";
import { answerNudgeText, collectText, dayBeforeText, inviteText, reminderText, teamsShareUrl } from "./share";

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


describe("プライベートの会", () => {
  it("催促も集金の案内も、友達どうしの言い方にする(敬語は会社の会だけ)", () => {
    expect(reminderText("private", "", [{ name: "山田", amount: 3000 }]).startsWith("この前の飲み会のお会計、まだの人お願いします")).toBe(true);
    expect(reminderText("worker", "", [{ name: "山田", amount: 3000 }]).startsWith("お疲れさまです。")).toBe(true);
    expect(collectText("同期会", "https://x", "private")).toBe("「同期会」のお会計です\n自分の金額を見て、幹事に払ってね\nhttps://x");
  });
});

describe("dayBeforeText", () => {
  it("明日の会の日時とお店と URL", () => {
    expect(dayBeforeText("忘年会", "2026-11-13", 1140, "有頂天", "https://x")).toBe(
      "明日は「忘年会」\n11/13(金) 19:00〜 有頂天\n場所と地図はこちら\nhttps://x",
    );
  });
});

describe("answerNudgeText", () => {
  it("答えた人数だけを書き、誰がまだかは書かない", () => {
    expect(answerNudgeText("忘年会", "https://x", 3)).toBe("「忘年会」の日程、いま3人が回答済み\nまだの人は30秒で入れてください\nhttps://x");
  });
});
