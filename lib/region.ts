import { AUDIENCES, type Audience } from "./audience";
import { AREAS } from "./sendai";

// 会の地域。仙台(本拠地)は自前の細かいエリアで探し、ほかの地域はホットペッパーの地域(中エリア)から選ぶ。
// null は仙台(地域の機能を足す前の会も、すべて仙台として扱う)

export type Region = { code: string; name: string } | null;

/** 回答で選ぶ「行きやすい場所」の1つ。仙台は AREAS の key、ほかの地域はホットペッパーの小エリアのコード */
export type AreaOption = { key: string; label: string; note?: string };

export function isRegion(v: unknown): v is NonNullable<Region> {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.code === "string" && /^Y\d{3}$/.test(r.code) && typeof r.name === "string" && r.name.length <= 40;
}

export function regionName(region: Region): string {
  return region ? region.name : "仙台";
}

/** 仙台の場所の選択肢。学生と社会人で、よく使う場所を先に出す */
export function sendaiAreas(audience: Audience): AreaOption[] {
  return AUDIENCES[audience].areas.map((k) => {
    const a = AREAS.find((x) => x.key === k)!;
    return { key: a.key, label: a.label, note: a.note };
  });
}
