import type { AreaKey, Budget } from "./sendai";

// 学生・プライベート・会社のどれか。最初の画面で選び、予算・時刻・エリア・お店の並び・送る文の言い方を変える。
// worker は「会社」(前の「社会人」。前に作った会はそのまま会社として扱う)。private は社会人の友達どうしの会

export type Audience = "student" | "private" | "worker";

/** 選ぶ画面に並べる順 */
export const AUDIENCE_ORDER: Audience[] = ["student", "private", "worker"];

export function isAudience(v: unknown): v is Audience {
  return v === "student" || v === "private" || v === "worker";
}

/** 社会人の会か(プライベートも会社も)。タバコを聞く・予算の幅などに使う */
export function isAdult(a: Audience): boolean {
  return a !== "student";
}

/** 敬語で送る会か。会社の会だけ。プライベートは友達どうしの言い方にする */
export function isFormal(a: Audience): boolean {
  return a === "worker";
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
    budgets: [2000, 3000, 4000, 5000, 6000],
    arrivals: [1080, 1110, 1140, 1170, 1200, 1260],
    areas: ["ichibancho", "katahira", "station", "kokubuncho", "nagamachi", "izumi"],
    prefer: ["学割", "飲み放題"],
  },
  private: {
    label: "プライベート",
    note: "友達・地元の仲間・同期",
    budgets: [3000, 4000, 5000, 6000, 8000],
    arrivals: [1080, 1110, 1140, 1170, 1200, 1260],
    areas: ["ichibancho", "kokubuncho", "station", "nagamachi", "izumi", "katahira"],
    prefer: ["飲み放題", "個室"],
  },
  worker: {
    label: "会社",
    note: "職場・部署・取引先",
    budgets: [3000, 4000, 5000, 6000, 8000],
    arrivals: [1080, 1110, 1140, 1170, 1200, 1260],
    areas: ["ichibancho", "kokubuncho", "station", "nagamachi", "izumi", "katahira"],
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
