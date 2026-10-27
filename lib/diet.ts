// 苦手なもの・アレルギーと、お酒を飲むかどうか。
// 誰が何を選んだかは出さず、人数だけをまとめて、お店選びと予約のときに使う

export const AVOIDS = [
  { key: "shrimp", label: "えび・かに" },
  { key: "soba", label: "そば" },
  { key: "milk", label: "乳製品" },
  { key: "egg", label: "卵" },
  { key: "wheat", label: "小麦" },
  { key: "nuts", label: "ナッツ・落花生" },
  { key: "raw", label: "生もの" },
  { key: "spicy", label: "辛いもの" },
] as const;
export type AvoidKey = (typeof AVOIDS)[number]["key"];

export function isAvoidKey(v: unknown): v is AvoidKey {
  return AVOIDS.some((a) => a.key === v);
}

export type DietSummary = {
  /** 選んだ人がいる苦手なもの(多い順)。名前は持たない */
  avoids: { key: AvoidKey; label: string; count: number }[];
  /** お酒を飲まない人の数 */
  nonDrinkers: number;
  /** タバコを吸う人の数(社会人の会だけで聞く) */
  smokers: number;
  /** 自由に書かれた苦手なもの(同じものは1つにまとめる)。誰が書いたかは持たない */
  others: string[];
};

/** 行く人の答えから、苦手なものとお酒を飲まない人の数をまとめる */
export function summarizeDiet(
  people: { avoids?: string[]; drinks?: boolean; smokes?: boolean; avoidNote?: string }[],
): DietSummary {
  const avoids = AVOIDS.map((a) => ({
    key: a.key,
    label: a.label,
    count: people.filter((p) => p.avoids?.includes(a.key)).length,
  }))
    .filter((a) => a.count > 0)
    .sort((x, y) => y.count - x.count);
  const others = [...new Set(people.map((p) => p.avoidNote?.trim() ?? "").filter((t) => t !== ""))];
  return {
    avoids,
    nonDrinkers: people.filter((p) => p.drinks === false).length,
    smokers: people.filter((p) => p.smokes === true).length,
    others,
  };
}

/** お店に伝える一言(「えび・かにが苦手な人が1人・お酒を飲まない人が2人」)。何もなければ null */
export function dietNotice(diet: DietSummary): string | null {
  const parts = [
    ...diet.avoids.map((a) => `${a.label}が苦手な人が${a.count}人`),
    ...(diet.others.length > 0 ? [`そのほか苦手なもの(${diet.others.join("、")})`] : []),
    ...(diet.nonDrinkers > 0 ? [`お酒を飲まない人が${diet.nonDrinkers}人`] : []),
    ...(diet.smokers > 0 ? [`タバコを吸う人が${diet.smokers}人(喫煙できる席を希望)`] : []),
  ];
  return parts.length > 0 ? parts.join("・") : null;
}
