// 駅。参加者がそれぞれ「行きやすい駅」を1つ選び、みんなが集まりやすい駅の近くでお店を探す。
// 駅名から場所を引くのは HeartRails Express(無料の駅データ)。ここは純粋関数だけを置く

export type Station = {
  name: string;
  /** 都道府県。同じ名前の駅を見分ける */
  pref: string;
  lat: number;
  lng: number;
};

/** 日本の中の緯度・経度か(おかしな値を保存しない) */
function inJapan(lat: number, lng: number): boolean {
  return lat >= 20 && lat <= 46 && lng >= 122 && lng <= 154;
}

export function isStation(v: unknown): v is Station {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.name === "string" && s.name.length >= 1 && s.name.length <= 30 &&
    typeof s.pref === "string" && s.pref.length <= 10 &&
    typeof s.lat === "number" && typeof s.lng === "number" &&
    inJapan(s.lat, s.lng)
  );
}

/** 入力された駅名を、検索に使う形にする(前後の空白と、最後の「駅」を取る) */
export function normalizeStationQuery(q: string): string {
  return q.trim().replace(/駅$/, "").slice(0, 30);
}

/** 2点の距離(km)。近いかどうかを比べるだけなので、球面の近似で足りる */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 同じ駅(名前と都道府県が同じ)を1つにまとめる */
export function sameStation(a: Station, b: Station): boolean {
  return a.name === b.name && a.pref === b.pref;
}

/**
 * みんなが集まりやすい駅。選ばれた駅の中から、全員の駅までの距離の合計がいちばん短いものを選ぶ。
 * 同じ合計なら、選んだ人が多い駅、それも同じなら先に選ばれた駅。誰も選んでいなければ null
 */
export function meetingStation(stations: Station[]): Station | null {
  if (stations.length === 0) return null;
  const unique: Station[] = [];
  for (const s of stations) if (!unique.some((u) => sameStation(u, s))) unique.push(s);
  const scored = unique.map((c, i) => ({
    c,
    i,
    total: stations.reduce((sum, s) => sum + distanceKm(c, s), 0),
    votes: stations.filter((s) => sameStation(s, c)).length,
  }));
  scored.sort((x, y) => x.total - y.total || y.votes - x.votes || x.i - y.i);
  return scored[0].c;
}

/** 駅ごとの人数(多い順)。誰が選んだかは持たない */
export function stationVotes(stations: Station[]): { station: Station; votes: number }[] {
  const out: { station: Station; votes: number }[] = [];
  for (const s of stations) {
    const hit = out.find((o) => sameStation(o.station, s));
    if (hit) hit.votes++;
    else out.push({ station: s, votes: 1 });
  }
  return out.sort((a, b) => b.votes - a.votes);
}
