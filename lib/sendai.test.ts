import { describe, expect, it } from "vitest";
import { inputFromMinutes, isArrival, isStay, minutesFromInput, stayLabel } from "./sendai";

describe("自由に書いた時刻", () => {
  it("来られる時刻は 15:00〜24:00 の5分きざみ", () => {
    expect(isArrival(1065)).toBe(true); // 17:45
    expect(isArrival(1067)).toBe(false);
    expect(isArrival(840)).toBe(false);
  });
  it("残れる時刻は夜をまたいで書ける", () => {
    expect(minutesFromInput("01:30", true)).toBe(1530);
    expect(minutesFromInput("21:15", true)).toBe(1275);
    expect(minutesFromInput("17:45", false)).toBe(1065);
    expect(isStay(1530)).toBe(true);
    expect(stayLabel(1530)).toBe("25:30まで");
    expect(inputFromMinutes(1530)).toBe("01:30");
  });
});
