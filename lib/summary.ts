import { AREAS, FIRST_PARTY_MINUTES, type AreaKey } from "./sendai";

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
  areas: AreaKey[];
};

export type DateRank = { date: string; ok: number; maybe: number };

export type Summary = {
  answered: number;
  ranking: DateRank[];
  /** 行ける人がいちばん多い日。誰も行けなければ null */
  date: string | null;
  /** その日に行ける人 */
  attendees: { name: string; arrival: number; stay: number }[];
  /** その日に「たぶん」の人 */
  maybes: string[];
  start: number | null;
  /** 開始に間に合わず、途中から来る人 */
  lateJoiners: string[];
  firstEnd: number | null;
  /** 一次会のあとも残れる人 */
  secondParty: string[];
  /** 行ける人全員が出せる額(誰の額かは出さない) */
  budget: number | null;
  area: AreaKey | null;
  areaVotes: { key: AreaKey; votes: number }[];
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

export function summarize(dates: string[], answers: Answer[], fixedDate?: string | null): Summary {
  const ranking = rankDates(dates, answers);
  const best = fixedDate ?? (ranking[0] && ranking[0].ok > 0 ? ranking[0].date : null);
  const going = best ? answers.filter((a) => a.dates[best] === "ok") : [];
  const start = startTime(going.map((a) => a.arrival));
  const firstEnd = start === null ? null : start + FIRST_PARTY_MINUTES;

  const areaVotes = AREAS.map((a) => ({
    key: a.key,
    votes: going.filter((g) => g.areas.includes(a.key)).length,
  })).filter((v) => v.votes > 0);
  // 同じ票数なら、選択肢の並び順(集まりやすい順)で先のもの
  const topArea = areaVotes.reduce<{ key: AreaKey; votes: number } | null>(
    (top, v) => (top === null || v.votes > top.votes ? v : top),
    null,
  );

  return {
    answered: answers.length,
    ranking,
    date: best,
    attendees: going.map((a) => ({ name: a.name, arrival: a.arrival, stay: a.stay })),
    maybes: best ? answers.filter((a) => a.dates[best] === "maybe").map((a) => a.name) : [],
    start,
    lateJoiners: start === null ? [] : going.filter((a) => a.arrival > start).map((a) => a.name),
    firstEnd,
    secondParty: firstEnd === null ? [] : going.filter((a) => a.stay > firstEnd).map((a) => a.name),
    budget: going.length > 0 ? Math.min(...going.map((a) => a.budget)) : null,
    area: topArea?.key ?? null,
    areaVotes: areaVotes.sort((x, y) => y.votes - x.votes),
  };
}
