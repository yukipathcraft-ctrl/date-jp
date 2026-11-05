// Google マップでお店を探す URL。API を使わない普通のリンクなので、お金はかからない。純粋関数

/** hint = 同じ名前のお店と見分けるための場所の手がかり(最寄り駅など)。なければお店の名前だけで探す */
export function mapsUrl(shopName: string, hint?: string | null): string {
  const q = hint ? `${shopName} ${hint}` : shopName;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** お店の「行き方」の最初のひとかたまり(「仙台駅[北出口6]から徒歩1分/…」なら「仙台駅」)。地図の手がかりに使う */
export function accessHint(access: string | null | undefined): string | null {
  const m = (access ?? "").match(/([^\s・/【】\[\]()（）]+?駅)/);
  return m ? m[1] : null;
}
