import type { Audience } from "./audience";

// 傾斜の割り勘。金額は整数(円)で扱う純粋関数
// 重みは 0.1 単位を10倍した整数で持つ(1.3 → 13)。小数の誤差を出さないため

/** 区分の色。globals.css の .tier-* */
export type Tone = "red" | "blue" | "yellow" | "green" | "purple";

export type Weight = { key: string; label: string; note: string; tenths: number; mark: string; tone: Tone };

export const WEIGHTS: Record<Audience, Weight[]> = {
  student: [
    { key: "more", label: "多め", note: "先輩・OB", tenths: 13, mark: "▲", tone: "blue" },
    { key: "normal", label: "ふつう", note: "同期", tenths: 10, mark: "●", tone: "yellow" },
    { key: "less", label: "少なめ", note: "後輩・1年", tenths: 7, mark: "▼", tone: "green" },
    { key: "soft", label: "飲まない", note: "ソフトドリンク", tenths: 6, mark: "◇", tone: "purple" },
  ],
  worker: [
    { key: "boss", label: "上司", note: "部長・課長", tenths: 15, mark: "★", tone: "red" },
    { key: "senior", label: "先輩", note: "", tenths: 12, mark: "▲", tone: "blue" },
    { key: "normal", label: "ふつう", note: "同期", tenths: 10, mark: "●", tone: "yellow" },
    { key: "junior", label: "新人", note: "1〜2年目", tenths: 7, mark: "▼", tone: "green" },
    { key: "soft", label: "飲まない", note: "ソフトドリンク", tenths: 7, mark: "◇", tone: "purple" },
  ],
};

export const ROUND_UNITS = [10, 100, 500] as const;

export type SplitInput = {
  /** 合計(円) */
  total: number;
  /** 1人ずつの重み(10倍した整数) */
  weights: number[];
  /** 何円単位にそろえるか */
  unit: number;
  /** 端数を受け持つ人(幹事)の番号 */
  organizer: number;
};

export type SplitResult = {
  amounts: number[];
  /** 幹事が、重みどおりの額より多く(+)または少なく(-)払う額 */
  organizerDiff: number;
};

/**
 * 重みに比べて割り、幹事以外は unit 円単位の近い額にそろえる。合計とのずれは幹事が受け持つ。
 * 幹事の額がマイナスになるときは、ほかの人を切り捨てにして、ずれを小さくする
 */
export function splitBill({ total, weights, unit, organizer }: SplitInput): SplitResult {
  const n = weights.length;
  if (n === 0 || !Number.isInteger(total) || total <= 0) return { amounts: weights.map(() => 0), organizerDiff: 0 };
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (total * w) / sum);

  const build = (round: (x: number) => number) => {
    const amounts = exact.map((x, i) => (i === organizer ? 0 : round(x / unit) * unit));
    const others = amounts.reduce((a, b) => a + b, 0);
    amounts[organizer] = total - others;
    return amounts;
  };
  let amounts = build(Math.round);
  if (amounts[organizer] < 0) amounts = build(Math.floor);

  return { amounts, organizerDiff: Math.round(amounts[organizer] - exact[organizer]) };
}
