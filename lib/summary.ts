import { summarizeDiet, type DietSummary } from "./diet";
import type { AreaOption } from "./region";
import { AREAS, FIRST_PARTY_MINUTES } from "./sendai";

// みんなの回答から、日・時刻・予算・場所・残れる人を決める。純粋関数

export type DateAnswer = "ok" | "maybe" | "no";

export type Answer = {
  id: string;
  name: string;
  dates: Record<string, DateAnswer>;
  /** 何時から来られるか(分) */
  arrival: number;
  /** いつまで残れるか(分) */
  stay: number;
  /** 1人あたりの予算の上限(円) */
  budget: number;
  /** 行きやすい場所の key(仙台のエリア、またはその地域の小エリアのコード) */
  areas: string[];
  /** ひとこと。みんなに見える(予定の事情や、2次会は無理など) */
  memo?: string;
  /** 苦手なもの・アレルギー(lib/diet.ts の key)。人数だけを出し、誰が選んだかは出さない */
  avoids?: string[];
  /** お酒を飲むか。前の答えにはないので、ないときは飲むとみなす */
  drinks?: boolean;
  /** タバコを吸うか(社会人の会だけで聞く)。人数だけを出し、誰かは出さない */
  smokes?: boolean;
  /** 選択肢にない苦手なもの(自由に書く)。名前は付けずに出す */
  avoidNote?: string;
};

export type DateRank = { date: string; ok: number; maybe: number };

export type Summary = {
  answered: number;
  ranking: DateRank[];
  /** 行ける人がいちばん多い日。誰も行けなければ null */
  date: string | null;
  /** その日に行ける人。soft = お酒を飲まない(会計で「飲まない」の区分に入れる) */
  attendees: { name: string; arrival: number; stay: number; soft: boolean }[];
  /** 行く人の苦手なものと、お酒を飲まない人の数(名前は持たない) */
  diet: DietSummary;
  /** その日に「たぶん」の人 */
  maybes: string[];
  /** ひとことを書いた人(行けない人のものも出す) */
  notes: { name: string; memo: string }[];
  start: number | null;
  /** 開始に間に合わず、途中から来る人 */
  lateJoiners: string[];
  firstEnd: number | null;
  /** 一次会のあとも残れる人 */
  secondParty: string[];
  /** 行ける人全員が出せる額(誰の額かは出さない) */
  budget: number | null;
  area: string | null;
  areaName: string | null;
  areaVotes: { key: string; label: string; votes: number }[];
};

export function rankDates(dates: string[], answers: Answer[]): DateRank[] {
  return dates
    .map((date) => ({
      date,
      ok: answers.filter((a) => a.dates[date] === "ok").length,
      maybe: answers.filter((a) => a.dates[date] === "maybe").length,
    }))
    .sort((x, y) => y.ok - x.ok || y.maybe - x.maybe || x.date.localeCompare(y.date));
}

/**
 * 開始時刻は、全員がそろう時刻。ただし3人以上で1人だけ遅い人がいれば、その人を待たずに始め、途中から合流してもらう
 */
export function startTime(arrivals: number[]): number | null {
  if (arrivals.length === 0) return null;
  const sorted = [...arrivals].sort((a, b) => a - b);
  const last = sorted[sorted.length - 1];
  const second = sorted[sorted.length - 2];
  if (sorted.length >= 3 && last > second) return second;
  return last;
}

/** areas = その会の「行きやすい場所」の選択肢(並び順は集まりやすい順)。省くと仙台のエリア */
export function summarize(
  dates: string[],
  answers: Answer[],
  fixedDate?: string | null,
  areas: AreaOption[] = AREAS.map((a) => ({ key: a.key, label: a.label })),
): Summary {
  const ranking = rankDates(dates, answers);
  const best = fixedDate ?? (ranking[0] && ranking[0].ok > 0 ? ranking[0].date : null);
  const going = best ? answers.filter((a) => a.dates[best] === "ok") : [];
  const start = startTime(going.map((a) => a.arrival));
  const firstEnd = start === null ? null : start + FIRST_PARTY_MINUTES;

  const areaVotes = areas
    .map((a) => ({
      key: a.key,
      label: a.label,
      votes: going.filter((g) => g.areas.includes(a.key)).length,
    }))
    .filter((v) => v.votes > 0);
  // 同じ票数なら、選択肢の並び順(集まりやすい順)で先のもの
  const topArea = areaVotes.reduce<{ key: string; label: string; votes: number } | null>(
    (top, v) => (top === null || v.votes > top.votes ? v : top),
    null,
  );

  return {
    answered: answers.length,
    ranking,
    date: best,
    attendees: going.map((a) => ({ name: a.name, arrival: a.arrival, stay: a.stay, soft: a.drinks === false })),
    diet: summarizeDiet(going),
    maybes: best ? answers.filter((a) => a.dates[best] === "maybe").map((a) => a.name) : [],
    notes: answers.filter((a) => a.memo).map((a) => ({ name: a.name, memo: a.memo! })),
    start,
    lateJoiners: start === null ? [] : going.filter((a) => a.arrival > start).map((a) => a.name),
    firstEnd,
    secondParty: firstEnd === null ? [] : going.filter((a) => a.stay > firstEnd).map((a) => a.name),
    budget: going.length > 0 ? Math.min(...going.map((a) => a.budget)) : null,
    area: topArea?.key ?? null,
    areaName: topArea?.label ?? null,
    areaVotes: areaVotes.sort((x, y) => y.votes - x.votes),
  };
}
