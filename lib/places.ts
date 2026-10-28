import "server-only";
import { cleanEnv } from "./env";
import { weightedScore, type Rating } from "./rating";
import type { Shop } from "./shops";

// お店に Google の評価(★と口コミの数)をつける。GOOGLE_PLACES_API_KEY があるときだけ Google に聞き、
// なければ評価なしにする(見本のお店には見本の評価をつける)。
// 食べログなどは規約で評価の転載を禁じているので使わない。
// Google の規約で、評価は保存せずに毎回聞く(キャッシュしない)。1軒ごとにお金がかかるので、出すお店の分だけ聞く

const API = "https://places.googleapis.com/v1/places:searchText";
/** 同じお店とみなす距離(m)。ホットペッパーと Google で、位置が少しずれていることがある */
const SAME_PLACE_M = 250;

type Place = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  location?: { latitude: number; longitude: number };
};

/** 2点の距離(m) */
function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.sqrt(x * x + y * y) * 6_371_000;
}

/** 見本のお店の、見本の評価。id から決めるので、開くたびに変わらない */
function sampleRating(id: string): Rating {
  const h = [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 7);
  const value = Math.round((3.3 + (h % 14) / 10) * 10) / 10;
  const count = [4, 12, 38, 96, 214, 530, 1180][h % 7];
  return { value, count, score: weightedScore(value, count), mapsUrl: null, sample: true };
}

async function lookup(key: string, shop: Shop): Promise<Rating | null> {
  if (shop.lat === null || shop.lng === null) return null;
  const res = await fetch(API, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.rating,places.userRatingCount,places.googleMapsUri,places.location",
    },
    body: JSON.stringify({
      textQuery: shop.name,
      languageCode: "ja",
      regionCode: "JP",
      pageSize: 1,
      locationBias: { circle: { center: { latitude: shop.lat, longitude: shop.lng }, radius: SAME_PLACE_M } },
    }),
  });
  if (!res.ok) throw new Error(`places ${res.status}`);
  const place = ((await res.json()) as { places?: Place[] }).places?.[0];
  if (!place?.location || typeof place.rating !== "number" || !place.userRatingCount) return null;
  // 名前が似た別のお店を拾わないよう、位置が離れていれば使わない
  if (distance({ lat: shop.lat, lng: shop.lng }, { lat: place.location.latitude, lng: place.location.longitude }) > SAME_PLACE_M) return null;
  return {
    value: place.rating,
    count: place.userRatingCount,
    score: weightedScore(place.rating, place.userRatingCount),
    mapsUrl: place.googleMapsUri ?? null,
    sample: false,
  };
}

/** お店に評価をつける。聞けなかったお店は評価なしのまま返す(お店を出すのは止めない) */
export async function withRatings(shops: Shop[]): Promise<Shop[]> {
  const key = cleanEnv(process.env.GOOGLE_PLACES_API_KEY);
  return Promise.all(
    shops.map(async (s) => {
      if (s.sample) return { ...s, rating: sampleRating(s.id) };
      if (!key) return s;
      try {
        return { ...s, rating: await lookup(key, s) };
      } catch (e) {
        console.error("[places] 評価を読めませんでした", e);
        return s;
      }
    }),
  );
}
