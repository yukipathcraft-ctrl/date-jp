import "server-only";
import type { Audience } from "./audience";
import { cleanEnv } from "./env";
import { sendaiAreas, type AreaOption, type Region } from "./region";

// 仙台以外の地域。ホットペッパーの地域の一覧(中エリア・小エリア)を読む。一覧はめったに変わらないので1日覚えておく

const BASE = "https://webservice.recruit.co.jp/hotpepper";

type HpArea = { code: string; name: string; large_area?: { name?: string } };

async function master(kind: "middle_area" | "small_area", params: Record<string, string>): Promise<HpArea[]> {
  const key = cleanEnv(process.env.HOTPEPPER_API_KEY);
  if (!key) return [];
  const url = new URL(`${BASE}/${kind}/v1/`);
  url.search = new URLSearchParams({ key, format: "json", ...params }).toString();
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const body = (await res.json()) as { results?: Record<string, HpArea[] | undefined> };
    return body.results?.[kind] ?? [];
  } catch (e) {
    console.error("[areas] ホットペッパーの地域を読めませんでした", e);
    return [];
  }
}

/** 地域を名前で探す(「渋谷」「梅田」など)。都道府県の名前も添える */
export async function searchRegions(keyword: string): Promise<{ code: string; name: string; pref: string }[]> {
  const k = keyword.trim().slice(0, 20);
  if (!k) return [];
  const list = await master("middle_area", { keyword: k });
  return list.slice(0, 12).map((a) => ({ code: a.code, name: a.name, pref: a.large_area?.name ?? "" }));
}

/** 地域のコードが本当にあるか確かめ、正しい名前を返す(ブラウザから来た名前は使わない) */
export async function findRegion(code: string): Promise<NonNullable<Region> | null> {
  if (!/^Y\d{3}$/.test(code)) return null;
  const [a] = await master("middle_area", { middle_area: code });
  return a ? { code: a.code, name: a.name } : null;
}

/** その地域の「行きやすい場所」の選択肢。仙台は自前のエリア、ほかはホットペッパーの小エリア */
export async function areaOptions(region: Region, audience: Audience): Promise<AreaOption[]> {
  if (!region) return sendaiAreas(audience);
  const list = await master("small_area", { middle_area: region.code });
  return list.map((a) => ({ key: a.code, label: a.name }));
}
