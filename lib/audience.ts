import type { AreaKey, Budget } from "./sendai";

// 学生か社会人か。最初の画面で選び、予算・時刻・エリア・お店の並びを変える

export type Audience = "student" | "worker";

export function isAudience(v: unknown): v is Audience {
  return v === "student" || v === "worker";
}

export const AUDIENCES: Record<
  Audience,
  {
    label: string;
    note: string;
    budgets: Budget[];
    arrivals: number[];
    /** 先に出すエリア */
    areas: AreaKey[];
    /** お店を選ぶときに先に出す特徴 */
    prefer: string[];
  }
> = {
  student: {
    label: "学生",
    note: "サークル・ゼミ・バイト先",
    budgets: [2000, 3000, 4000, 5000],
    arrivals: [1080, 1110, 1140, 1170, 1200, 1260],
    areas: ["katahira", "station", "kokubuncho", "ichibancho", "nagamachi", "izumi"],
    prefer: ["学割", "飲み放題"],
  },
  worker: {
    label: "社会人",
    note: "職場・同期・取引先",
    budgets: [3000, 4000, 5000, 6000, 8000],
    arrivals: [1110, 1140, 1170, 1200, 1230, 1260],
    areas: ["kokubuncho", "station", "ichibancho", "nagamachi", "izumi", "katahira"],
    prefer: ["個室", "飲み放題"],
  },
};

const KEY = "nomi:audience";

export function loadAudience(): Audience | null {
  try {
    const v = localStorage.getItem(KEY);
    return isAudience(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveAudience(a: Audience) {
  try {
    localStorage.setItem(KEY, a);
  } catch {}
}
