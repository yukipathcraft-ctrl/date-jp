// 仙台で使う選択肢。エリア・予算・来られる時刻・残れる時刻

export type AreaKey = "station" | "kokubuncho" | "ichibancho" | "katahira" | "nagamachi" | "izumi";

export const AREAS: { key: AreaKey; label: string; note: string; lat: number; lng: number }[] = [
  { key: "station", label: "仙台駅前", note: "集まりやすい", lat: 38.2601, lng: 140.8824 },
  { key: "kokubuncho", label: "国分町", note: "お店が多い", lat: 38.2652, lng: 140.8706 },
  { key: "ichibancho", label: "一番町・広瀬通", note: "駅から歩ける", lat: 38.2618, lng: 140.873 },
  { key: "katahira", label: "五橋・片平", note: "東北大の近く", lat: 38.2533, lng: 140.8768 },
  { key: "nagamachi", label: "長町", note: "南側に住む人向け", lat: 38.2263, lng: 140.8858 },
  { key: "izumi", label: "泉中央", note: "北側に住む人向け", lat: 38.3233, lng: 140.8812 },
];

export function isAreaKey(v: unknown): v is AreaKey {
  return AREAS.some((a) => a.key === v);
}

export function areaLabel(key: string): string {
  return AREAS.find((a) => a.key === key)?.label ?? key;
}

/** お店のジャンル。hotpepper はホットペッパーのジャンルコード */
export const GENRES = [
  { key: "izakaya", label: "居酒屋", hotpepper: ["G001"] },
  { key: "washoku", label: "和食", hotpepper: ["G004"] },
  { key: "yoshoku", label: "洋食", hotpepper: ["G005", "G006"] },
  { key: "chuka", label: "中華", hotpepper: ["G007"] },
  { key: "yakiniku", label: "焼肉・韓国", hotpepper: ["G008", "G017"] },
] as const;
export type GenreKey = (typeof GENRES)[number]["key"];

export function isGenreKey(v: unknown): v is GenreKey {
  return GENRES.some((g) => g.key === v);
}

/** 1人あたりの予算の上限(円)。学生と社会人で出す範囲を変える(lib/audience.ts) */
export const BUDGETS = [2000, 3000, 4000, 5000, 6000, 8000] as const;
export type Budget = (typeof BUDGETS)[number];

export function isBudget(v: unknown): v is Budget {
  return BUDGETS.includes(v as Budget);
}

/**
 * 答えの「上限なし」。いちばん安い額を選ぶ計算(Math.min)でそのまま扱えるよう、大きな数で持つ。
 * 全員が上限なしなら、予算でお店を絞らない
 */
export const UNLIMITED_BUDGET = 1_000_000;

/** 答えで選べる予算か(選択肢の額か、上限なし) */
export function isAnswerBudget(v: unknown): v is number {
  return isBudget(v) || v === UNLIMITED_BUDGET;
}

/** 予算の見せ方。上限なしは「上限なし」 */
export function budgetLabel(n: number): string {
  return n >= UNLIMITED_BUDGET ? "上限なし" : `${yen(n)}まで`;
}

export function yen(n: number): string {
  return `${n.toLocaleString("ja-JP")}円`;
}

/** 何時から来られるか。分で持つ(18:00 = 1080) */
export const ARRIVALS = [1080, 1110, 1140, 1170, 1200, 1230, 1260] as const;

/** 選択肢にない時刻も書ける。5分きざみで、15:00〜24:00 の間 */
export function isArrival(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) % 5 === 0 && (v as number) >= 900 && (v as number) <= 1440;
}

/** いつまで残れるか。分で持つ。終電は仙台市地下鉄の最終(0時ごろ)、朝までは 30時 */
export const STAYS = [
  { minutes: 1260, label: "21時まで" },
  { minutes: 1320, label: "22時まで" },
  { minutes: 1380, label: "23時まで" },
  { minutes: 1440, label: "終電まで" },
  { minutes: 1800, label: "最後まで" },
] as const;

/** 選択肢にない時刻も書ける。5分きざみで、18:00〜朝6:00(30:00)の間 */
export function isStay(v: unknown): v is number {
  return (
    STAYS.some((s) => s.minutes === v) ||
    (Number.isInteger(v) && (v as number) % 5 === 0 && (v as number) >= 1080 && (v as number) <= 1800)
  );
}

export function stayLabel(minutes: number): string {
  return STAYS.find((s) => s.minutes === minutes)?.label ?? `${clock(minutes)}まで`;
}

/**
 * 時刻の入力欄("01:30")を分にする。残れる時刻は夜をまたぐので、昼の12時より前は翌日として24時間足す
 */
export function minutesFromInput(value: string, overnight: boolean): number | null {
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return overnight && minutes < 720 ? minutes + 1440 : minutes;
}

/** 分を時刻の入力欄の形("25:30" → "01:30")にする */
export function inputFromMinutes(minutes: number): string {
  const t = minutes % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** 1080 → "18:00" */
export function clock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** 一次会の長さ。飲み放題の2時間に合わせる */
export const FIRST_PARTY_MINUTES = 120;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-11-14" → "11/14(土)" */
export function dateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}/${d}(${WEEKDAYS[w]})`;
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 日本時間の今日から n 日分の日付 */
export function upcomingDates(now: Date, days: number): string[] {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate() + i));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** 二次会で絞り込める種類。hotpepper はホットペッパーのジャンルコード */
export const SECOND_GENRES = [
  { key: "izakaya", label: "居酒屋", hotpepper: ["G001"] },
  { key: "bar", label: "バー", hotpepper: ["G002", "G012"] },
  { key: "karaoke", label: "カラオケ", hotpepper: ["G011"] },
] as const;
export type SecondGenreKey = (typeof SECOND_GENRES)[number]["key"];

export function isSecondGenreKey(v: unknown): v is SecondGenreKey {
  return SECOND_GENRES.some((g) => g.key === v);
}
