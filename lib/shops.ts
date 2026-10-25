import "server-only";
import { cleanEnv } from "./env";
import { AREAS, type AreaKey } from "./sendai";

// お店の候補。ホットペッパーの API キーがあれば実際のお店を出し、なければ見本のお店を出す。
// お店のページへは必ず /go を通し、押された数を数える(送客の手数料の根拠にする)

export type Shop = {
  id: string;
  name: string;
  genre: string;
  area: AreaKey;
  access: string;
  /** 1人あたりの目安(円) */
  budget: number;
  budgetLabel: string;
  capacity: number | null;
  features: string[];
  photo: string | null;
  /** お店のページ。見本のお店は null */
  url: string | null;
  sample: boolean;
};

export type ShopQuery = { area: AreaKey; budget: number; size: number };

// 見本のお店。実在しない
const SAMPLES: Shop[] = [
  sample("s1", "見本 炉端 あおば", "居酒屋", "station", "仙台駅 西口 徒歩3分", 3000, 40, ["飲み放題", "個室"]),
  sample("s2", "見本 牛たん酒場 ひろせ", "居酒屋", "station", "仙台駅 徒歩5分", 3800, 30, ["飲み放題"]),
  sample("s3", "見本 大衆酒場 こくぶん", "居酒屋", "kokubuncho", "勾当台公園駅 徒歩4分", 2500, 60, ["飲み放題", "学割"]),
  sample("s4", "見本 ダイニング 定禅寺", "ダイニングバー", "kokubuncho", "勾当台公園駅 徒歩6分", 4500, 25, ["個室"]),
  sample("s5", "見本 串焼き いちばん", "焼き鳥", "ichibancho", "青葉通一番町駅 徒歩2分", 2800, 35, ["飲み放題"]),
  sample("s6", "見本 チーズとワイン ひろせ通", "イタリアン", "ichibancho", "広瀬通駅 徒歩3分", 3500, 20, ["飲み放題", "女子会"]),
  sample("s7", "見本 学生酒場 かたひら", "居酒屋", "katahira", "五橋駅 徒歩3分", 2000, 50, ["飲み放題", "学割", "個室"]),
  sample("s8", "見本 韓国料理 いつつばし", "韓国料理", "katahira", "五橋駅 徒歩5分", 2800, 30, ["飲み放題"]),
  sample("s9", "見本 海鮮居酒屋 ながまち", "居酒屋", "nagamachi", "長町駅 徒歩2分", 3200, 45, ["飲み放題", "個室"]),
  sample("s10", "見本 鉄板酒場 いずみ", "鉄板焼き", "izumi", "泉中央駅 徒歩3分", 3000, 40, ["飲み放題"]),
];

function sample(
  id: string,
  name: string,
  genre: string,
  area: AreaKey,
  access: string,
  budget: number,
  capacity: number,
  features: string[],
): Shop {
  return {
    id,
    name,
    genre,
    area,
    access,
    budget,
    budgetLabel: `${budget.toLocaleString("ja-JP")}円くらい`,
    capacity,
    features,
    photo: null,
    url: null,
    sample: true,
  };
}

/** 予算と人数に合うお店。エリアに合うものがなければ、ほかのエリアから出す */
export function pickSamples(q: ShopQuery, limit = 3): { shops: Shop[]; otherArea: boolean } {
  const fits = SAMPLES.filter((s) => s.budget <= q.budget && (s.capacity ?? 0) >= q.size).sort(
    (a, b) => b.budget - a.budget,
  );
  const inArea = fits.filter((s) => s.area === q.area);
  if (inArea.length > 0) return { shops: inArea.slice(0, limit), otherArea: false };
  return { shops: fits.slice(0, limit), otherArea: fits.length > 0 };
}

// ホットペッパーのディナー予算コードと、その上限(円)
const BUDGET_CODES: [string, number][] = [
  ["B010", 1000],
  ["B011", 1500],
  ["B001", 2000],
  ["B002", 3000],
  ["B003", 4000],
  ["B008", 5000],
  ["B004", 7000],
];

/** 予算以内のコードのうち、高いほうから2つ(API は2つまで指定できる) */
export function budgetCodes(budget: number): string[] {
  return BUDGET_CODES.filter(([, max]) => max <= budget)
    .slice(-2)
    .map(([code]) => code);
}

type HotpepperShop = {
  id: string;
  name: string;
  access?: string;
  mobile_access?: string;
  genre?: { name?: string };
  budget?: { code?: string; name?: string; average?: string };
  capacity?: number | string;
  private_room?: string;
  free_drink?: string;
  lat?: number | string;
  lng?: number | string;
  photo?: { pc?: { l?: string } };
  urls?: { pc?: string };
};

const API = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";

function fromHotpepper(s: HotpepperShop, area: AreaKey): Shop {
  const max = BUDGET_CODES.find(([code]) => code === s.budget?.code)?.[1] ?? 0;
  const features = [
    s.free_drink?.startsWith("あり") ? "飲み放題" : null,
    s.private_room?.startsWith("あり") ? "個室" : null,
  ].filter((f): f is string => f !== null);
  const capacity = Number(s.capacity);
  return {
    id: s.id,
    name: s.name,
    genre: s.genre?.name ?? "",
    area,
    access: s.mobile_access || s.access || "",
    budget: max,
    budgetLabel: s.budget?.average || s.budget?.name || "",
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
    features,
    photo: s.photo?.pc?.l ?? null,
    url: s.urls?.pc ?? null,
    sample: false,
  };
}

async function callHotpepper(key: string, params: Record<string, string>): Promise<HotpepperShop[]> {
  const url = new URL(API);
  url.search = new URLSearchParams({ key, format: "json", ...params }).toString();
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`hotpepper ${res.status}`);
  const body = (await res.json()) as { results?: { shop?: HotpepperShop[]; error?: unknown } };
  if (body.results?.error) throw new Error(`hotpepper ${JSON.stringify(body.results.error)}`);
  return body.results?.shop ?? [];
}

export async function searchShops(q: ShopQuery, limit = 3): Promise<{ shops: Shop[]; otherArea: boolean }> {
  const key = cleanEnv(process.env.HOTPEPPER_API_KEY);
  if (!key) return pickSamples(q, limit);
  const area = AREAS.find((a) => a.key === q.area)!;
  const codes = budgetCodes(q.budget);
  try {
    const shops = await callHotpepper(key, {
      lat: String(area.lat),
      lng: String(area.lng),
      range: "3", // 1km
      party_capacity: String(q.size),
      ...(codes.length > 0 ? { budget: codes.join(",") } : {}),
      count: String(limit),
      order: "4", // おすすめ順
    });
    return { shops: shops.map((s) => fromHotpepper(s, q.area)), otherArea: false };
  } catch (e) {
    console.error("[shops] ホットペッパーから読めなかったため、見本を出します", e);
    return pickSamples(q, limit);
  }
}

/** /go で使う。id から、飛ばしてよいお店のページを引く(外から来た URL には飛ばさない) */
export async function findShop(id: string): Promise<Shop | null> {
  const sampleShop = SAMPLES.find((s) => s.id === id);
  if (sampleShop) return sampleShop;
  const key = cleanEnv(process.env.HOTPEPPER_API_KEY);
  if (!key || !/^J\d{6,12}$/.test(id)) return null;
  try {
    const [shop] = await callHotpepper(key, { id });
    return shop ? fromHotpepper(shop, "station") : null;
  } catch (e) {
    console.error("[shops] お店を引けませんでした", e);
    return null;
  }
}

/**
 * 送客の手数料が付くリンクにする。AFFILIATE_URL_TEMPLATE に {url} を含むテンプレートを入れておく
 * (例: バリューコマースの「MyLink」の形)。空なら、お店のページにそのまま飛ばす
 */
export function referralUrl(shopUrl: string): string {
  const template = process.env.AFFILIATE_URL_TEMPLATE?.trim();
  if (!template || !template.includes("{url}")) return shopUrl;
  return template.replace("{url}", encodeURIComponent(shopUrl));
}
