/** お店ごとに押された数を数え、多い順に10件 */
export function countShops(shopIds: string[]): { shopId: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const id of shopIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([shopId, count]) => ({ shopId, count }))
    .sort((a, b) => b.count - a.count || a.shopId.localeCompare(b.shopId))
    .slice(0, 10);
}
