import { describe, expect, it } from "vitest";
import { parseAnswer, parseParty } from "./validation";

const answer = { name: "山田", dates: { "2026-11-06": "ok" }, stay: 1320, budget: 4000, areas: ["station"] };

describe("parseParty", () => {
  it("幹事が選んだ開始時刻を受け取る", () => {
    const r = parseParty({ title: "歓迎会", audience: "worker", dates: ["2026-11-06"], start: 1170 }, "2026-10-28");
    expect(r.ok && r.value.start).toBe(1170);
    expect(r.ok && r.value.deadline).toBeNull();
  });
  it("回答の締め切りを受け取り、過去の日は受け付けない", () => {
    const base = { title: "歓迎会", audience: "worker", dates: ["2026-11-06"], start: 1170 };
    const r = parseParty({ ...base, deadline: "2026-11-01" }, "2026-10-28");
    expect(r.ok && r.value.deadline).toBe("2026-11-01");
    expect(parseParty({ ...base, deadline: "2026-10-27" }, "2026-10-28").ok).toBe(false);
  });
  it("開始時刻がなければ作れない", () => {
    expect(parseParty({ title: "歓迎会", audience: "worker", dates: ["2026-11-06"], start: undefined }, "2026-10-28").ok).toBe(false);
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

describe("parseAnswer の場所", () => {
  it("場所を選ばなくても(どこでもいい)答えられる", () => {
    const r = parseAnswer({ ...answer, areas: [] }, ["2026-11-06"], 1140);
    expect(r.ok && r.value.areas).toEqual([]);
  });
});
