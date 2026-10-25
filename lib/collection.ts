import { isAudience, type Audience } from "./audience";
import { ROUND_UNITS, splitBill, CUSTOM_MAX, CUSTOM_MIN } from "./split";
import type { CollectionPerson, Payment } from "./store/types";

// 傾斜会計から集金のページを作るときの、入力の確かめと金額の計算し直し。純粋関数

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const TONES = ["red", "blue", "yellow", "green", "purple", "gray"] as const;

export type CollectionInput = {
  title: unknown;
  audience: unknown;
  total: unknown;
  unit: unknown;
  organizer: unknown;
  people: unknown;
};

export type ParsedCollection = { title: string; audience: Audience; total: number; people: CollectionPerson[] };

/** 画面から来た値を確かめ、金額はサーバーで計算し直す(画面の金額は信じない) */
export function parseCollection(input: CollectionInput): Result<ParsedCollection> {
  const total = Number(input.total);
  if (!Number.isInteger(total) || total < 1 || total > 9_999_999) return { ok: false, error: "お会計の合計を入れてください" };
  const unit = Number(input.unit);
  if (!(ROUND_UNITS as readonly number[]).includes(unit)) return { ok: false, error: "何円単位にそろえるかを選んでください" };
  const raw = Array.isArray(input.people) ? (input.people as Record<string, unknown>[]) : [];
  if (raw.length < 2 || raw.length > 30) return { ok: false, error: "2人から30人までにしてください" };
  const organizer = Number(input.organizer);
  if (!Number.isInteger(organizer) || organizer < 0 || organizer >= raw.length) return { ok: false, error: "幹事を選んでください" };

  const rows: Omit<CollectionPerson, "amount" | "organizer">[] = [];
  const tenths: number[] = [];
  for (const [i, p] of raw.entries()) {
    const name = typeof p.name === "string" && p.name.trim() ? p.name.trim().slice(0, 20) : `${i + 1}人目`;
    const t = Number(p.tenths);
    if (!Number.isInteger(t) || t < CUSTOM_MIN || t > CUSTOM_MAX) return { ok: false, error: `${name}さんの倍率を確かめてください` };
    const tone = TONES.find((x) => x === p.tone) ?? "gray";
    rows.push({
      id: i + 1,
      name,
      label: typeof p.label === "string" ? p.label.slice(0, 10) : "",
      mark: typeof p.mark === "string" ? p.mark.slice(0, 2) : "",
      tone,
    });
    tenths.push(t);
  }
  const { amounts } = splitBill({ total, weights: tenths, unit, organizer });
  return {
    ok: true,
    value: {
      title: typeof input.title === "string" ? input.title.trim().slice(0, 30) : "",
      audience: isAudience(input.audience) ? input.audience : "student",
      total,
      people: rows.map((r, i) => ({ ...r, amount: amounts[i], organizer: i === organizer })),
    },
  };
}

/**
 * 「払った」を押してよいか。幹事は誰でも切り替えられる。
 * 参加した人は「払った」にできるが、取り消せるのは本人が押したものだけ(幹事が受け取りを記録したものは戻せない)
 */
export function canSetPayment(current: Payment | undefined, next: boolean, isHost: boolean): boolean {
  if (isHost) return true;
  if (next) return current === undefined;
  return current?.by === "self";
}
