import { describe, expect, it } from "vitest";
import { parseAnswer, parseParty } from "./validation";

const answer = { name: "山田", dates: { "2026-11-06": "ok" }, stay: 1320, budget: 4000, areas: ["station"] };

describe("parseParty", () => {
  it("幹事が選んだ開始時刻を受け取る", () => {
    const r = parseParty({ title: "歓迎会", audience: "worker", dates: ["2026-11-06"], start: 1170 });
    expect(r.ok && r.value.start).toBe(1170);
  });
  it("開始時刻がなければ作れない", () => {
    expect(parseParty({ title: "歓迎会", audience: "worker", dates: ["2026-11-06"], start: undefined }).ok).toBe(false);
  });
});

describe("parseAnswer の開始時刻", () => {
  it("幹事が開始時刻を決めた会では、何時から来られるかを聞かずにその時刻にする", () => {
    const r = parseAnswer(answer, ["2026-11-06"], 1200);
    expect(r.ok && r.value.arrival).toBe(1200);
  });
  it("前の会(開始時刻なし)では、来られる時刻が要る", () => {
    expect(parseAnswer(answer, ["2026-11-06"], null).ok).toBe(false);
    const r = parseAnswer({ ...answer, arrival: 1170 }, ["2026-11-06"], null);
    expect(r.ok && r.value.arrival).toBe(1170);
  });
});
