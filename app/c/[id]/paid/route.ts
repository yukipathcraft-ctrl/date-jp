import { NextResponse } from "next/server";
import { paidCollection } from "@/lib/billing";
import { getStore } from "@/lib/store";

// Stripe で支払ったあとに戻ってくるところ。Stripe に支払いを確かめ、済んでいれば経費精算の名簿と金額を使えるようにして、
// 集金のページへ戻す(幹事の鍵はこの端末に残っているので、そこから名簿を開ける)
export async function GET(request: Request, ctx: RouteContext<"/c/[id]/paid">) {
  const { id } = await ctx.params;
  const session = new URL(request.url).searchParams.get("session") ?? "";
  const back = new URL(`/c/${encodeURIComponent(id)}`, request.url);
  try {
    const paidFor = await paidCollection(session);
    if (paidFor === id) {
      await getStore().markCollectionPaid(id, session);
      back.searchParams.set("paid", "1");
    }
  } catch (e) {
    console.error("[billing] 支払いを確かめられませんでした", e);
  }
  return NextResponse.redirect(back);
}
