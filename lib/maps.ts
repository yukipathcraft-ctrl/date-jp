// Google マップでお店を探す URL。API を使わない普通のリンクなので、お金はかからない。純粋関数

export function mapsUrl(shopName: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shopName} 仙台`)}`;
}
