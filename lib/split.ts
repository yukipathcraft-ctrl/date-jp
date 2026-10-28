import type { Audience } from "./audience";

// 傾斜の割り勘。金額は整数(円)で扱う純粋関数
// 重みは 0.1 単位を10倍した整数で持つ(1.3 → 13)。小数の誤差を出さないため

/** 区分の色。globals.css の .tier-* */
export type Tone = "red" | "blue" | "yellow" | "green" | "purple" | "gray";

export type Weight = { key: string; label: string; note: string; tenths: number; mark: string; tone: Tone };

export const WEIGHTS: Record<Audience, Weight[]> = {
  student: [
    { key: "more", label: "多め", note: "先輩・OB", tenths: 13, mark: "▲", tone: "blue" },
    { key: "normal", label: "ふつう", note: "同期", tenths: 10, mark: "●", tone: "yellow" },
    { key: "less", label: "少なめ", note: "後輩・1年", tenths: 7, mark: "▼", tone: "green" },
    { key: "soft", label: "飲まない", note: "ソフトドリンク", tenths: 6, mark: "◇", tone: "purple" },
  ],
  // 友達どうしは上下が少ないので、割り勘を基本に、多め・少なめだけ
  private: [
    { key: "more", label: "多め", note: "年上・誘った人", tenths: 13, mark: "▲", tone: "blue" },
    { key: "normal", label: "ふつう", note: "", tenths: 10, mark: "●", tone: "yellow" },
    { key: "less", label: "少なめ", note: "年下", tenths: 8, mark: "▼", tone: "green" },
    { key: "soft", label: "飲まない", note: "ソフトドリンク", tenths: 7, mark: "◇", tone: "purple" },
  ],
  worker: [
    { key: "boss", label: "上司", note: "部長・課長", tenths: 15, mark: "★", tone: "red" },
    { key: "senior", label: "先輩", note: "", tenths: 12, mark: "▲", tone: "blue" },
    { key: "normal", label: "ふつう", note: "同期", tenths: 10, mark: "●", tone: "yellow" },
    { key: "junior", label: "新人", note: "1〜2年目", tenths: 7, mark: "▼", tone: "green" },
    { key: "soft", label: "飲まない", note: "ソフトドリンク", tenths: 7, mark: "◇", tone: "purple" },
  ],
};

/** 自分で書く倍率の範囲(0.1〜5.0)。10倍した整数で持つ */
export const CUSTOM_MIN = 1;
export const CUSTOM_MAX = 50;

/** 書いた倍率("1.25" や "２")を、0.1 単位の整数にする。読めなければ null */
export function tenthsFromInput(text: string): number | null {
  const n = Number(text.normalize("NFKC").trim());
  if (text.trim() === "" || !Number.isFinite(n)) return null;
  const t = Math.round(n * 10);
  return t >= CUSTOM_MIN && t <= CUSTOM_MAX ? t : null;
}

export const ROUND_UNITS = [10, 100, 500] as const;

/** 会社や部署・部費から出る補助。per = 1人あたり、lump = 全体でいくら */
export type Subsidy = { kind: "per" | "lump"; yen: number };

/**
 * 補助の合計(円)。お会計の合計を超えない。
 * 会社の飲み会では「会社から1人3,000円」のような補助がよくあり、残りをみんなで割る
 */
export function subsidyTotal(s: Subsidy | null, total: number, people: number): number {
  if (!s || !Number.isInteger(s.yen) || s.yen <= 0 || total <= 0) return 0;
  return Math.min(total, s.kind === "per" ? s.yen * people : s.yen);
}

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
