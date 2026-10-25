import "server-only";
import { cleanEnv } from "./env";
import { AUDIENCES, type Audience } from "./audience";
import { AREAS, GENRES, type AreaKey, type GenreKey } from "./sendai";

// お店の候補。ホットペッパーの API キーがあれば実際のお店を出し、なければ見本のお店を出す。
// お店のページへは必ず /go を通し、押された数を数える(送客の手数料の根拠にする)

export type Shop = {
  id: string;
  name: string;
  genre: string;
  genreKey: GenreKey | null;
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

export type ShopQuery = {
  area: AreaKey;
  /** 予算の上限。null なら指定なし */
  budget: number | null;
  size: number;
  genre?: GenreKey | null;
  privateRoom?: boolean;
  audience?: Audience;
};

// 見本のお店。実在しない
const SAMPLES: Shop[] = [
  sample("s1", "見本 炉端 あおば", "izakaya", "station", "仙台駅 西口 徒歩3分", 3000, 40, ["飲み放題", "個室"]),
  sample("s2", "見本 牛たん酒場 ひろせ", "washoku", "station", "仙台駅 徒歩5分", 3800, 30, ["飲み放題"]),
  sample("s3", "見本 大衆酒場 こくぶん", "izakaya", "kokubuncho", "勾当台公園駅 徒歩4分", 2500, 60, ["飲み放題", "学割"]),
  sample("s4", "見本 ダイニング 定禅寺", "yoshoku", "kokubuncho", "勾当台公園駅 徒歩6分", 4500, 25, ["個室"]),
  sample("s5", "見本 串焼き いちばん", "izakaya", "ichibancho", "青葉通一番町駅 徒歩2分", 2800, 35, ["飲み放題"]),
  sample("s6", "見本 チーズとワイン ひろせ通", "yoshoku", "ichibancho", "広瀬通駅 徒歩3分", 3500, 20, ["飲み放題"]),
  sample("s7", "見本 学生酒場 かたひら", "izakaya", "katahira", "五橋駅 徒歩3分", 2000, 50, ["飲み放題", "学割", "個室"]),
  sample("s8", "見本 韓国料理 いつつばし", "yakiniku", "katahira", "五橋駅 徒歩5分", 2800, 30, ["飲み放題", "学割"]),
  sample("s9", "見本 海鮮居酒屋 ながまち", "izakaya", "nagamachi", "長町駅 徒歩2分", 3200, 45, ["飲み放題", "個室"]),
  sample("s10", "見本 鉄板酒場 いずみ", "izakaya", "izumi", "泉中央駅 徒歩3分", 3000, 40, ["飲み放題"]),
  sample("s11", "見本 割烹 一番町", "washoku", "ichibancho", "青葉通一番町駅 徒歩4分", 6500, 24, ["個室"]),
  sample("s12", "見本 中華酒家 えきまえ", "chuka", "station", "仙台駅 徒歩4分", 4000, 40, ["飲み放題", "個室"]),
  sample("s13", "見本 焼肉 こくぶん", "yakiniku", "kokubuncho", "勾当台公園駅 徒歩5分", 5500, 30, ["飲み放題", "個室"]),
  sample("s14", "見本 和食ダイニング 定禅寺", "washoku", "kokubuncho", "勾当台公園駅 徒歩3分", 7500, 20, ["個室"]),
  sample("s15", "見本 餃子酒場 かたひら", "chuka", "katahira", "五橋駅 徒歩4分", 2200, 30, ["飲み放題", "学割"]),
];

function sample(
  id: string,
  name: string,
  genreKey: GenreKey,
  area: AreaKey,
  access: string,
  budget: number,
  capacity: number,
  features: string[],
): Shop {
  return {
    id,
    name,
    genre: GENRES.find((g) => g.key === genreKey)!.label,
    genreKey,
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

/** 学生なら学割・飲み放題、社会人なら個室のお店を先に出す。同じなら予算いっぱいに近い順 */
function preferScore(s: Shop, audience: Audience | undefined): number {
  if (!audience) return 0;
  return AUDIENCES[audience].prefer.filter((f) => s.features.includes(f)).length;
}

/** 条件に合うお店。エリアに合うものがなければ、ほかのエリアから出す */
export function pickSamples(q: ShopQuery, limit = 3): { shops: Shop[]; otherArea: boolean } {
  const fits = SAMPLES.filter(
    (s) =>
      (q.budget === null || s.budget <= q.budget) &&
      (s.capacity ?? 0) >= q.size &&
      (!q.genre || s.genreKey === q.genre) &&
      (!q.privateRoom || s.features.includes("個室")),
  ).sort((a, b) => preferScore(b, q.audience) - preferScore(a, q.audience) || b.budget - a.budget);
  const inArea = fits.filter((s) => s.area === q.area);
  if (inArea.length > 0) return { shops: inArea.slice(0, limit), otherArea: false };
  return { shops: fits.slice(0, limit), otherArea: fits.length > 0 };
}

/**
 * ディナー予算の区分名(「5001～6000円」「～500円」「30001円～」)から上限を読む。
 * 区分のコードは B015(5001～6000円)のように後から増えるので、コードの表は持たずに名前から読む
 */
export function budgetFromRange(name: string | undefined): number {
  if (!name) return 0;
  const t = name.normalize("NFKC").trim();
  const nums = t.match(/[0-9][0-9,]*/g);
  if (!nums) return 0;
  if (/[～~〜]$/.test(t)) return Number.POSITIVE_INFINITY;
  return Number(nums[nums.length - 1].replace(/,/g, ""));
}

type HotpepperShop = {
  id: string;
  name: string;
  access?: string;
  mobile_access?: string;
  genre?: { code?: string; name?: string };
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

/**
 * 予算コードがないお店は、目安の文(「12,000円」「7000円～8000円」「昼750円/夜1000円」)から夜の額を読む。
 * 読めなければ 0 にして、予算の条件では落とさない
 */
export function budgetFromText(text: string | undefined): number {
  if (!text) return 0;
  const t = text.normalize("NFKC");
  const night = t.match(/夜[^0-9]*([0-9][0-9,]*)/);
  const first = t.match(/([0-9][0-9,]*)\s*円/);
  // 「5500」のように数字だけのこともある
  const bare = t.match(/^\s*([0-9][0-9,]*)\s*$/);
  const n = Number((night?.[1] ?? first?.[1] ?? bare?.[1] ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fromHotpepper(s: HotpepperShop, area: AreaKey): Shop {
  const max = budgetFromRange(s.budget?.name) || budgetFromText(s.budget?.average);
  const features = [
    s.free_drink?.startsWith("あり") ? "飲み放題" : null,
    s.private_room?.startsWith("あり") ? "個室" : null,
  ].filter((f): f is string => f !== null);
  const capacity = Number(s.capacity);
  return {
    id: s.id,
    name: s.name.normalize("NFKC"),
    genre: s.genre?.name ?? "",
    genreKey: GENRES.find((g) => (g.hotpepper as readonly string[]).includes(s.genre?.code ?? ""))?.key ?? null,
    area,
    // お店の説明には半角カナ(ﾋﾞﾙ など)が混ざるので、全角にそろえる
    access: (s.mobile_access || s.access || "").normalize("NFKC").trim(),
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
  try {
    // 予算は API に渡すと2つの価格帯しか選べず、安いお店が抜けるので、多めに取ってからこちらで上限を切る
    const params = {
      lat: String(area.lat),
      lng: String(area.lng),
      party_capacity: String(q.size),
      ...(q.genre ? { genre: GENRES.find((g) => g.key === q.genre)!.hotpepper.join(",") } : {}),
      ...(q.privateRoom ? { private_room: "1" } : {}),
      count: "50",
      order: "4", // おすすめ順
    };
    const fits = (list: HotpepperShop[]) =>
      list.map((s) => fromHotpepper(s, q.area)).filter((s) => q.budget === null || s.budget <= q.budget);
    // まずはそのエリアの中(500m)だけで探し、足りなければ1kmまで広げる。
    // 国分町と仙台駅前は1kmほどしか離れていないので、最初から広く探すと隣のエリアのお店が混ざる
    let shops = fits(await callHotpepper(key, { ...params, range: "2" }));
    let otherArea = false;
    if (shops.length < limit) {
      const seen = new Set(shops.map((s) => s.id));
      const extra = fits(await callHotpepper(key, { ...params, range: "3" })).filter((s) => !seen.has(s.id));
      otherArea = shops.length === 0 && extra.length > 0;
      shops = [...shops, ...extra];
    }
    return { shops: shops.slice(0, limit), otherArea };
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
