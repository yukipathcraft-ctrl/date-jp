import { describe, expect, it } from "vitest";
import { reminderText } from "./share";

describe("reminderText", () => {
  it("まだの人の名前と金額だけを並べる", () => {
    const text = reminderText("student", "ゼミの打ち上げ", [
      { name: "山田", amount: 3200 },
      { name: "佐藤", amount: 2400 },
    ]);
    expect(text).toContain("「ゼミの打ち上げ」のお会計、まだの人は幹事までお願いします!");
    expect(text).toContain("・山田さん 3,200円");
    expect(text).toContain("・佐藤さん 2,400円");
  });
  it("社会人向けは丁寧な言い方にし、名前がなければ「先日の会」にする", () => {
    const text = reminderText("worker", "  ", [{ name: "鈴木", amount: 5000 }]);
    expect(text.startsWith("お疲れさまです。\n先日の会のお会計がまだの方は、幹事までお願いいたします。")).toBe(true);
    expect(text).toContain("行き違いでお支払い済みの場合は、ご容赦ください。");
  });
});
