// 席決め。名前をくじで混ぜて、テーブルに順番に配る(人数の差は1人まで)

/** 名前の入力を1行1人に分ける。空の行と、前後の空白は除く */
export function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

/**
 * names を tables 個のテーブルに分ける。rand は 0 以上 1 未満を返す関数(テストでは決まった値を渡す)。
 * 混ぜてから1人ずつ順に配るので、テーブルごとの人数の差は1人までになる
 */
export function assignSeats(names: string[], tables: number, rand: () => number = Math.random): string[][] {
  const n = Math.max(1, Math.min(Math.floor(tables), names.length || 1));
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const out: string[][] = Array.from({ length: n }, () => []);
  shuffled.forEach((name, i) => out[i % n].push(name));
  return out;
}

/** LINE で送る文 */
export function seatsText(result: string[][]): string {
  return ["席決めの結果です", ...result.map((t, i) => `${i + 1}卓: ${t.join("、")}`)].join("\n");
}
