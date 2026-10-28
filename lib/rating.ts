// お店の評価。Google の★と口コミの数から、口コミの少なさも加味した点を出す。純粋関数
//
// ★4.9 でも口コミが5件しかないお店と、★4.2 で口コミが800件あるお店では、後者のほうが確か。
// そこで「どのお店も、はじめは平均的なお店(PRIOR)の口コミを WEIGHT 件ぶん持っている」とみなして平均を取る
// (ベイズ平均)。口コミが多いほど元の★に近づき、少ないほど平均に寄る

/** 仙台の飲み屋の Google の★の、だいたいの平均 */
export const PRIOR = 3.7;
/** 平均に寄せる強さ(口コミ何件ぶんか) */
export const WEIGHT = 30;

export type Rating = {
  /** Google の★(1〜5)。変えずにそのまま出す */
  value: number;
  /** 口コミの数 */
  count: number;
  /** 口コミの数を加味した点。並べ替えと「評価が高い」の印に使う */
  score: number;
  /** Google マップのお店のページ */
  mapsUrl: string | null;
  /** 見本のお店につけた見本の評価か */
  sample: boolean;
};

/** 口コミの数を加味した点(小数第2位まで) */
export function weightedScore(value: number, count: number, prior = PRIOR, weight = WEIGHT): number {
  const n = Math.max(0, count);
  return Math.round(((prior * weight + value * n) / (weight + n)) * 100) / 100;
}

/** 点から「評価が高い」とみなすか。口コミが少ないと点が平均に寄るので、少ない口コミの高い★では付かない */
export function isHighlyRated(r: Pick<Rating, "score">): boolean {
  return r.score >= 4.0;
}

/** 評価のないお店は、平均的なお店として扱う(並べ替えで不利にも有利にもしない) */
export function scoreOf(r: Rating | null): number {
  return r?.score ?? PRIOR;
}

/** 口コミの数の見せ方。「1,234件」 */
export function countLabel(count: number): string {
  return `${count.toLocaleString("ja-JP")}件`;
}
