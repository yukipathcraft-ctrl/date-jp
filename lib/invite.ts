import type { Audience } from "./audience";

// 答えた人を、次の会の幹事にするための言葉と目印

/** 会がどこから作られたか。guest = 前にほかの会で答えたことがある人が作った */
export type Via = "guest" | null;

/**
 * その時期にありそうな次の会の呼び方。month は 1〜12。
 * 11〜12月は忘年会、1月は新年会、2〜3月は送別会(学生は追いコン)、4〜5月は歓迎会(学生は新歓)
 */
export function nextOccasion(month: number, audience: Audience): string {
  if (month === 11 || month === 12) return "忘年会";
  if (month === 1) return "新年会";
  if (month === 2 || month === 3) return audience === "student" ? "追いコン" : "送別会";
  if (month === 4 || month === 5) return audience === "student" ? "新歓" : "歓迎会";
  return "次の飲み会";
}

/** 日本時間の今の月(1〜12) */
export function monthInJapan(now: Date): number {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCMonth() + 1;
}

/** この端末で、ほかの会に答えたことがあるか(答えると nomi:me:{会の id} が残る) */
export function answeredBefore(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith("nomi:me:")) return true;
    }
  } catch {}
  return false;
}
