import { dateLabel } from "./sendai";

// 回答の締め切り。幹事が「いつまでに答えてほしいか」を決め、みんなの画面に残りの日数を出す。純粋関数
// 締め切りはその日の終わり(日本時間)まで。過ぎても答えられる(遅れた人を締め出さない)

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** 決められる締め切りは、今日から60日後まで */
export const MAX_DAYS_AHEAD = 60;

/** 作るときに選べる締め切り(今日から何日後か) */
export const DEADLINE_CHOICES = [
  { days: 1, label: "明日まで" },
  { days: 3, label: "3日後まで" },
  { days: 7, label: "1週間後まで" },
] as const;

const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** from から to まで何日か(to が前なら負) */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/** 締め切りとして受け付けてよいか。null(締め切りなし)はよい */
export function isValidDeadline(value: unknown, today: string): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || !DATE.test(value) || Number.isNaN(toUtc(value))) return false;
  const ahead = daysBetween(today, value);
  return ahead >= 0 && ahead <= MAX_DAYS_AHEAD;
}

/** 候補の日より前に答えてもらう必要があるので、いちばん早い候補の日以降の締め切りは選べないようにする */
export function choiceAllowed(deadline: string, dates: string[]): boolean {
  if (dates.length === 0) return true;
  return deadline < [...dates].sort()[0];
}

export type DeadlineState =
  | { kind: "open"; date: string; daysLeft: number; text: string }
  | { kind: "past"; date: string; text: string };

/** 今の締め切りの様子。「11/2(日)まで・あと3日」「今日まで」「締め切りました」 */
export function deadlineState(deadline: string | null, today: string): DeadlineState | null {
  if (!deadline) return null;
  const daysLeft = daysBetween(today, deadline);
  const when = `${dateLabel(deadline)}まで`;
  if (daysLeft < 0) return { kind: "past", date: deadline, text: `締め切りました(${when})` };
  return { kind: "open", date: deadline, daysLeft, text: daysLeft === 0 ? `今日まで(${when})` : `${when}・あと${daysLeft}日` };
}
