import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { findSponsor } from "@/lib/sponsors";

// 広告を押したときに通す。押された数を数えてから、広告主のページ(または電話)へ飛ばす。
// 飛ばす先は lib/sponsors.ts に書いたものだけ(外から渡された URL には飛ばさない)
export async function GET(request: Request, ctx: RouteContext<"/ad/[id]">) {
  const { id } = await ctx.params;
  const sponsor = findSponsor(id);
  if (!sponsor) return NextResponse.redirect(new URL("/", request.url));
  await getStore()
    .logAdEvent(sponsor.id, "click")
    .catch((e) => console.error("[ad] 数えられませんでした", e));
  return NextResponse.redirect(sponsor.url);
}
