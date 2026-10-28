import { describe, expect, it } from "vitest";
import { rankDates, startTime, summarize, type Answer } from "./summary";

const D1 = "2026-11-13";
const D2 = "2026-11-14";

function answer(name: string, over: Partial<Answer> = {}): Answer {
  return {
    id: name,
    name,
    dates: { [D1]: "ok", [D2]: "no" },
    arrival: 1080,
    stay: 1440,
    budget: 4000,
    areas: ["station"],
    ...over,
  };
}

describe("rankDates", () => {
  it("行ける人が多い順。同じなら「たぶん」が多い順、さらに同じなら早い日", () => {
    const answers = [
      answer("a", { dates: { [D1]: "ok", [D2]: "ok" } }),
      answer("b", { dates: { [D1]: "maybe", [D2]: "ok" } }),
      answer("c", { dates: { [D1]: "ok", [D2]: "no" } }),
    ];
    expect(rankDates([D1, D2], answers).map((r) => r.date)).toEqual([D1, D2]);
    expect(rankDates([D1, D2], answers.slice(0, 2))[0]).toEqual({ date: D2, ok: 2, maybe: 0, mustOk: true });
  });
});

describe("startTime", () => {
  it("全員がそろう時刻", () => {
    expect(startTime([1080, 1140])).toBe(1140);
  });
  it("3人以上で1人だけ遅いなら、その人を待たない", () => {
    expect(startTime([1080, 1110, 1260])).toBe(1110);
  });
  it("遅い人が2人なら待つ", () => {
    expect(startTime([1080, 1200, 1200])).toBe(1200);
  });
  it("誰もいなければ null", () => {
    expect(startTime([])).toBeNull();
  });
});

describe("summarize", () => {
  it("日・時刻・予算・場所・二次会に残る人を決める", () => {
    const answers = [
      answer("a", { arrival: 1080, stay: 1320, budget: 5000, areas: ["kokubuncho"] }),
      answer("b", { arrival: 1110, stay: 1800, budget: 3000, areas: ["kokubuncho", "station"] }),
      answer("c", { arrival: 1200, stay: 1440, budget: 4000, areas: ["station"] }),
      answer("d", { dates: { [D1]: "maybe" } }),
    ];
    const s = summarize([D1, D2], answers);
    expect(s.date).toBe(D1);
    expect(s.attendees.map((a) => a.name)).toEqual(["a", "b", "c"]);
    expect(s.maybes).toEqual(["d"]);
    expect(s.start).toBe(1110);
    expect(s.lateJoiners).toEqual(["c"]);
    expect(s.firstEnd).toBe(1230);
    expect(s.secondParty).toEqual(["a", "b", "c"]);
    expect(s.budget).toBe(3000);
    // 同票なら選択肢の並び順で先のもの(仙台駅前)
    expect(s.area).toBe("station");
  });

  it("一次会で帰る人は二次会に数えない", () => {
    const s = summarize([D1], [answer("a", { arrival: 1140, stay: 1260 }), answer("b", { arrival: 1140, stay: 1440 })]);
    expect(s.firstEnd).toBe(1260);
    expect(s.secondParty).toEqual(["b"]);
  });

  it("誰も行けない日しかなければ、何も決めない", () => {
    const s = summarize([D1], [answer("a", { dates: { [D1]: "no" } })]);
    expect(s.date).toBeNull();
    expect(s.budget).toBeNull();
    expect(s.start).toBeNull();
  });

  it("幹事が決めた日があれば、その日で数える", () => {
    const s = summarize([D1, D2], [answer("a"), answer("b", { dates: { [D2]: "ok" } })], D2);
    expect(s.date).toBe(D2);
    expect(s.attendees.map((a) => a.name)).toEqual(["b"]);
  });
});

describe("みんなのひとこと", () => {
  it("書いた人だけを、行けない人のものも含めて出す", () => {
    const s = summarize([D1], [answer("a", { memo: "2次会は無理そう" }), answer("b"), answer("c", { dates: { [D1]: "no" }, memo: "来週なら行けます" })]);
    expect(s.notes).toEqual([
      { name: "a", memo: "2次会は無理そう" },
      { name: "c", memo: "来週なら行けます" },
    ]);
  });
});

describe("summarize の食べたいもの", () => {
  it("行く人の食べたいものを多い順に数える(行けない人は数えない)", () => {
    const base = { arrival: 1140, stay: 1320, budget: 4000, areas: ["station" as const] };
    const s = summarize(
      ["2026-11-06"],
      [
        { ...base, id: "1", name: "A", dates: { "2026-11-06": "ok" }, likes: ["yakiniku", "izakaya"] },
        { ...base, id: "2", name: "B", dates: { "2026-11-06": "ok" }, likes: ["yakiniku"] },
        { ...base, id: "3", name: "C", dates: { "2026-11-06": "no" }, likes: ["chuka"] },
      ],
    );
    expect(s.likes.map((l) => [l.key, l.votes])).toEqual([
      ["yakiniku", 2],
      ["izakaya", 1],
    ]);
  });
});

describe("必ず来てほしい人", () => {
  it("その人が行ける日を、行ける人が多い日より先にする", () => {
    const answers = [
      answer("部長", { dates: { [D1]: "no", [D2]: "ok" } }),
      answer("a", { dates: { [D1]: "ok", [D2]: "no" } }),
      answer("b", { dates: { [D1]: "ok", [D2]: "no" } }),
    ];
    expect(rankDates([D1, D2], answers)[0].date).toBe(D1);
    const ranked = rankDates([D1, D2], answers, ["部長"]);
    expect(ranked.map((r) => [r.date, r.mustOk])).toEqual([
      [D2, true],
      [D1, false],
    ]);
    expect(summarize([D1, D2], answers, null, ["部長"]).date).toBe(D2);
  });

  it("まだ答えていない人と、決めた日に行けない人を出す", () => {
    const answers = [answer("部長", { dates: { [D1]: "no" } }), answer("a", { dates: { [D1]: "ok" } })];
    const s = summarize([D1], answers, D1, ["部長", "課長"]);
    expect(s.mustUnanswered).toEqual(["課長"]);
    expect(s.mustMissing).toEqual(["部長"]);
  });
});

describe("誰がいつ行けるかの表", () => {
  it("候補の日を日付の順に並べ、1人ずつの答えを返す(答えのない日は ×)", () => {
    const s = summarize([D2, D1], [answer("a", { dates: { [D1]: "ok", [D2]: "maybe" } }), answer("b", { dates: { [D1]: "no" } })]);
    expect(s.dates).toEqual([D1, D2]);
    expect(s.who).toEqual([
      { name: "a", dates: { [D2]: "maybe", [D1]: "ok" } },
      { name: "b", dates: { [D2]: "no", [D1]: "no" } },
    ]);
  });
});
