import { isAudience, type Audience } from "./audience";
import { isArrival, isAreaKey, isBudget, isStay, type AreaKey } from "./sendai";
import type { Answer, DateAnswer } from "./summary";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_DATES = 10;

function text(v: unknown, label: string, max: number): Result<string> {
  const s = typeof v === "string" ? v.trim() : "";
  if (s === "") return { ok: false, error: `${label}を入れてください` };
  if (s.length > max) return { ok: false, error: `${label}は${max}文字までにしてください` };
  return { ok: true, value: s };
}

export function parseParty(input: {
  title: unknown;
  audience: unknown;
  dates: unknown;
}): Result<{ title: string; audience: Audience; dates: string[] }> {
  const title = text(input.title, "飲み会の名前", 40);
  if (!title.ok) return title;
  const raw = Array.isArray(input.dates) ? input.dates : [];
  const dates = [...new Set(raw.filter((d): d is string => typeof d === "string" && DATE.test(d)))].sort();
  if (dates.length === 0) return { ok: false, error: "候補の日を1つ以上選んでください" };
  if (dates.length > MAX_DATES) return { ok: false, error: `候補の日は${MAX_DATES}つまでにしてください` };
  const audience = isAudience(input.audience) ? input.audience : "student";
  return { ok: true, value: { title: title.value, audience, dates } };
}

export type AnswerInput = Omit<Answer, "id">;

export function parseAnswer(input: Record<string, unknown>, partyDates: string[]): Result<AnswerInput> {
  const name = text(input.name, "名前", 20);
  if (!name.ok) return name;

  const rawDates = (input.dates ?? {}) as Record<string, unknown>;
  const dates: Record<string, DateAnswer> = {};
  for (const d of partyDates) {
    const v = rawDates[d];
    dates[d] = v === "ok" || v === "maybe" ? v : "no";
  }
  if (!isArrival(input.arrival)) return { ok: false, error: "何時から来られるかを選んでください" };
  if (!isStay(input.stay)) return { ok: false, error: "いつまで残れるかを選んでください" };
  if (!isBudget(input.budget)) return { ok: false, error: "予算を選んでください" };
  const areas = Array.isArray(input.areas) ? [...new Set(input.areas.filter(isAreaKey))] : [];
  if (areas.length === 0) return { ok: false, error: "行きやすい場所を1つ以上選んでください" };

  return {
    ok: true,
    value: {
      name: name.value,
      dates,
      arrival: input.arrival,
      stay: input.stay,
      budget: input.budget,
      areas: areas as AreaKey[],
    },
  };
}
