import { NextResponse } from "next/server";
import { findShop, referralUrl } from "@/lib/shops";
import { getStore } from "@/lib/store";

// お店のページへ飛ばす。押された数を数え、送客の手数料が付くリンクにする。
// 飛ばす先は id から引いたお店のページだけ(外から渡された URL には飛ばさない)
export async function GET(request: Request, ctx: RouteContext<"/go/[partyId]/[shopId]">) {
  const { partyId, shopId } = await ctx.params;
  const back = new URL(`/p/${encodeURIComponent(partyId)}#shops`, request.url);
  const store = getStore();
  const [party, shop] = await Promise.all([store.getParty(partyId), findShop(shopId)]);
  if (!party || !shop) return NextResponse.redirect(back);

  await store.logShopClick(party.id, shop.id).catch((e) => console.error("[go] 数えられませんでした", e));
  if (!shop.url) return NextResponse.redirect(back);
  return NextResponse.redirect(referralUrl(shop.url));
}
