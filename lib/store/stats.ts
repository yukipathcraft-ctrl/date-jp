import type { AdEventKind, AdStat } from "./types";

/** お店ごとに押された数を数え、多い順に10件 */
export function countShops(shopIds: string[]): { shopId: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const id of shopIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([shopId, count]) => ({ shopId, count }))
    .sort((a, b) => b.count - a.count || a.shopId.localeCompare(b.shopId))
    .slice(0, 10);
}

/** 広告ごとに、見られた数と押された数を数える(見られた多い順) */
export function countAds(events: { sponsorId: string; kind: AdEventKind }[]): AdStat[] {
  const m = new Map<string, AdStat>();
  for (const e of events) {
    const s = m.get(e.sponsorId) ?? { sponsorId: e.sponsorId, views: 0, clicks: 0 };
    if (e.kind === "view") s.views++;
    else s.clicks++;
    m.set(e.sponsorId, s);
  }
  return [...m.values()].sort((a, b) => b.views - a.views);
}
