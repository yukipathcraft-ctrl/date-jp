import { describe, expect, it } from "vitest";
import { addDays, choiceAllowed, daysBetween, deadlineState, isValidDeadline } from "./deadline";

describe("日付の計算", () => {
  it("月や年をまたいでも日数を足せる", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("日数の差は、前なら負になる", () => {
    expect(daysBetween("2026-10-28", "2026-11-04")).toBe(7);
    expect(daysBetween("2026-10-28", "2026-10-27")).toBe(-1);
  });
});

describe("isValidDeadline", () => {
  const today = "2026-10-28";
  it("締め切りなし・今日・60日後までは受け付ける", () => {
    expect(isValidDeadline(null, today)).toBe(true);
    expect(isValidDeadline("2026-10-28", today)).toBe(true);
    expect(isValidDeadline(addDays(today, 60), today)).toBe(true);
  });
  it("昨日・61日後・形の違う値は受け付けない", () => {
    expect(isValidDeadline("2026-10-27", today)).toBe(false);
    expect(isValidDeadline(addDays(today, 61), today)).toBe(false);
    expect(isValidDeadline("10/30", today)).toBe(false);
    expect(isValidDeadline(undefined, today)).toBe(false);
  });
});

it("いちばん早い候補の日と同じか、それより後の締め切りは選べない", () => {
  expect(choiceAllowed("2026-10-30", ["2026-11-05", "2026-10-31"])).toBe(true);
  expect(choiceAllowed("2026-10-31", ["2026-11-05", "2026-10-31"])).toBe(false);
  expect(choiceAllowed("2026-10-31", [])).toBe(true);
});

describe("deadlineState", () => {
  it("締め切りがなければ出さない", () => {
    expect(deadlineState(null, "2026-10-28")).toBeNull();
  });
  it("残りの日数を出し、当日は「今日まで」にする", () => {
    expect(deadlineState("2026-10-31", "2026-10-28")).toMatchObject({ kind: "open", daysLeft: 3, text: "10/31(土)まで・あと3日" });
    expect(deadlineState("2026-10-28", "2026-10-28")).toMatchObject({ kind: "open", daysLeft: 0, text: "今日まで(10/28(水)まで)" });
  });
  it("過ぎたら「締め切りました」にする", () => {
    expect(deadlineState("2026-10-27", "2026-10-28")).toMatchObject({ kind: "past", text: "締め切りました(10/27(火)まで)" });
  });
});
