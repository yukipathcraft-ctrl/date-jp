// 苦手なもの・アレルギーと、お酒を飲むかどうか。
// 誰が何を選んだかは出さず、人数だけをまとめて、お店選びと予約のときに使う

/**
 * kind: allergy = 食べると体に出るもの(表示が義務・推奨の食材が中心)、dislike = 苦手なもの。
 * 前からある key は変えない(前の答えが読めなくなるため)
 */
export const AVOIDS = [
  { key: "shrimp", label: "えび・かに", kind: "allergy" },
  { key: "soba", label: "そば", kind: "allergy" },
  { key: "milk", label: "乳製品", kind: "allergy" },
  { key: "egg", label: "卵", kind: "allergy" },
  { key: "wheat", label: "小麦", kind: "allergy" },
  { key: "nuts", label: "ナッツ・落花生", kind: "allergy" },
  { key: "shellfish", label: "貝類", kind: "allergy" },
  { key: "squid", label: "いか・たこ", kind: "allergy" },
  { key: "fish", label: "魚", kind: "allergy" },
  { key: "soy", label: "大豆", kind: "allergy" },
  { key: "sesame", label: "ごま", kind: "allergy" },
  { key: "fruit", label: "果物(キウイ・もも など)", kind: "allergy" },
  { key: "raw", label: "生もの", kind: "dislike" },
  { key: "spicy", label: "辛いもの", kind: "dislike" },
  { key: "offal", label: "ホルモン・レバー", kind: "dislike" },
  { key: "lamb", label: "羊肉", kind: "dislike" },
  { key: "coriander", label: "パクチー", kind: "dislike" },
  { key: "mushroom", label: "きのこ", kind: "dislike" },
  { key: "garlic", label: "にんにく", kind: "dislike" },
  { key: "cheese", label: "チーズ", kind: "dislike" },
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
