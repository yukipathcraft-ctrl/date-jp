import { icsContent } from "@/lib/calendar";
import { getStore } from "@/lib/store";

// 決まった会を iPhone などのカレンダーに入れるためのファイル。開くと「カレンダーに追加」が出る。
// 日にちとお店は参加者の URL でも見られる内容なので、鍵は要らない

export async function GET(request: Request, ctx: RouteContext<"/p/[id]/calendar.ics">) {
  const { id } = await ctx.params;
  const party = await getStore().getParty(id);
  if (!party?.decision) return new Response("まだ日にちが決まっていません", { status: 404 });
  const url = new URL(`/p/${encodeURIComponent(party.id)}`, request.url).toString();
  const body = icsContent(
    { title: party.title, date: party.decision.date, start: party.decision.start, location: party.decision.shopName, url },
    `${party.id}@date-jp`,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="date-${party.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
