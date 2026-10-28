// 席決め。名前をくじで混ぜて、テーブルに順番に配る(人数の差は1人まで)

export type Person = {
  name: string;
  /** 主役(送別会の主役、上司など)。1卓目から順に、いちばん奥の席(上座)に座る */
  honored?: boolean;
  /** 混ぜたいグループ(学年・部署など)。同じグループの人は、なるべく別のテーブルに分ける */
  group?: string;
  /** 役職の順で決めたときの順番(1 がいちばん偉い人)。くじのときはない */
  rank?: number;
};

/** 名前の入力を1行1人に分ける。空の行と、前後の空白は除く */
export function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * people を tables 個のテーブルに分ける。rand は 0 以上 1 未満を返す関数(テストでは決まった値を渡す)。
 * 1人ずつ順にテーブルへ配るので、人数の差は1人までになる。
 * 主役を先に配るので、主役は1卓目・2卓目…の最初の席(上座)に入る。
 * グループがある人は、グループごとにまとめてから配るので、同じグループの人は別々のテーブルに散る
 */
export function assignSeats(people: Person[], tables: number, rand: () => number = Math.random): Person[][] {
  const n = Math.max(1, Math.min(Math.floor(tables), people.length || 1));
  const honored = shuffle(
    people.filter((p) => p.honored),
    rand,
  );
  const rest = people.filter((p) => !p.honored);
  // グループの並びもくじで決め、グループの中も混ぜる。グループのない人は最後にまとめる
  const groups = shuffle([...new Set(rest.flatMap((p) => (p.group ? [p.group] : [])))], rand);
  const ordered = [
    ...groups.flatMap((g) => shuffle(rest.filter((p) => p.group === g), rand)),
    ...shuffle(
      rest.filter((p) => !p.group),
      rand,
    ),
  ];
  const out: Person[][] = Array.from({ length: n }, () => []);
  [...honored, ...ordered].forEach((p, i) => out[i % n].push(p));
  // 主役のいないテーブルは、座る順もくじで決める(グループが続けて並ばないように)
  return out.map((t) => (t[0]?.honored ? [t[0], ...shuffle(t.slice(1), rand)] : shuffle(t, rand)));
}

/**
 * 役職の順(会社の飲み会)。names は偉い人から順に並べたもの。
 * 1番目は1卓目の上座、2番目は2卓目の上座…と配り、テーブルの中は上座から順に座る。
 * 偉い人が1つのテーブルに固まらず、どのテーブルにも上の人がいるようにする
 */
export function rankSeats(names: string[], tables: number): Person[][] {
  const n = Math.max(1, Math.min(Math.floor(tables), names.length || 1));
  const out: Person[][] = Array.from({ length: n }, () => []);
  names.forEach((name, i) => out[i % n].push({ name, rank: i + 1 }));
  return out;
}

/** LINE で送る文。役職の順で決めたときは、上座からの順番を添える */
export function seatsText(result: Person[][]): string {
  const label = (p: Person, i: number) => (p.rank ? `${i + 1}.${p.name}` : p.honored ? `★${p.name}` : p.name);
  const head = result.some((t) => t.some((p) => p.rank)) ? "席順です(各卓、1 が上座)" : "席決めの結果です";
  return [head, ...result.map((t, i) => `${i + 1}卓: ${t.map(label).join("、")}`)].join("\n");
}
