import { summarizeDiet, type DietSummary } from "./diet";
import { AREAS, FIRST_PARTY_MINUTES, GENRES, type AreaKey, type GenreKey } from "./sendai";

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
  /** ひとこと。みんなに見える(予定の事情や、2次会は無理など) */
  memo?: string;
  /** 苦手なもの・アレルギー(lib/diet.ts の key)。人数だけを出し、誰が選んだかは出さない */
  avoids?: string[];
  /** お酒を飲むか。前の答えにはないので、ないときは飲むとみなす */
  drinks?: boolean;
  /** 食べたいもの(lib/sendai.ts の GENRES の key)。お店のおすすめに使う */
  likes?: string[];
  /** タバコを吸うか(社会人の会だけで聞く)。人数だけを出し、誰かは出さない */
  smokes?: boolean;
  /** 選択肢にない苦手なもの(自由に書く)。名前は付けずに出す */
  avoidNote?: string;
};

/** mustOk = 幹事が「必ず来てほしい」にした人が全員「行ける」の日(そういう人がいなければ true) */
export type DateRank = { date: string; ok: number; maybe: number; mustOk: boolean };

export type Summary = {
  answered: number;
  /** 答えた人の名前(幹事が「必ず来てほしい人」を選ぶのに使う) */
  names: string[];
  /** 「必ず来てほしい人」のうち、まだ答えていない人と、決めた日に行けない人 */
  mustUnanswered: string[];
  mustMissing: string[];
  /** 必ず来てほしい人の名前(表で目印を付ける) */
  must: string[];
  /** 候補の日(日付の順)と、1人ずつの答え。調整さんのように、誰がいつ行けるかを表で見せる */
  dates: string[];
  who: { name: string; dates: Record<string, DateAnswer> }[];
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
  area: AreaKey | null;
  areaVotes: { key: AreaKey; votes: number }[];
  /** 行く人の食べたいもの(多い順) */
  likes: { key: GenreKey; label: string; votes: number }[];
};

/**
 * 日の順位。must(必ず来てほしい人の名前)が全員行ける日を先にし、その中で行ける人が多い順。
 * 部長が来られない日にみんなが集まっても意味がない、という会社の飲み会のため
 */
export function rankDates(dates: string[], answers: Answer[], must: string[] = []): DateRank[] {
  const keyPeople = answers.filter((a) => must.includes(a.name));
  return dates
    .map((date) => ({
      date,
      ok: answers.filter((a) => a.dates[date] === "ok").length,
      maybe: answers.filter((a) => a.dates[date] === "maybe").length,
      mustOk: keyPeople.every((a) => a.dates[date] === "ok"),
    }))
    .sort((x, y) => Number(y.mustOk) - Number(x.mustOk) || y.ok - x.ok || y.maybe - x.maybe || x.date.localeCompare(y.date));
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

export function summarize(dates: string[], answers: Answer[], fixedDate?: string | null, must: string[] = []): Summary {
  const ranking = rankDates(dates, answers, must);
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
    names: answers.map((a) => a.name),
    must,
    dates: [...dates].sort(),
    who: answers.map((a) => ({ name: a.name, dates: Object.fromEntries(dates.map((d) => [d, a.dates[d] ?? "no"])) })),
    mustUnanswered: must.filter((n) => !answers.some((a) => a.name === n)),
    mustMissing: best ? answers.filter((a) => must.includes(a.name) && a.dates[best] !== "ok").map((a) => a.name) : [],
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
    areaVotes: areaVotes.sort((x, y) => y.votes - x.votes),
    likes: GENRES.map((g) => ({ key: g.key, label: g.label, votes: going.filter((a) => a.likes?.includes(g.key)).length }))
      .filter((g) => g.votes > 0)
      .sort((x, y) => y.votes - x.votes),
  };
}
