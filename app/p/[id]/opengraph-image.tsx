import { OG_SIZE, ogImage } from "@/lib/og";
import { clock, dateLabel } from "@/lib/sendai";
import { getStore } from "@/lib/store";

// 会の URL を LINE に貼ったときのカード。決まる前は「答えてください」、決まったら日時とお店を出す。
// 名前や答えの中身は出さない

export const alt = "Date の飲み会";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const party = await getStore()
    .getParty(id)
    .catch(() => null);
  if (!party) {
    return ogImage({ eyebrow: "飲み会", title: "見つかりませんでした" });
  }
  if (party.decision) {
    const d = party.decision;
    return ogImage({
      eyebrow: "決まりました",
      title: party.title,
      lines: [`${dateLabel(d.date)} ${clock(d.start)}から`, ...(d.shopName ? [d.shopName] : [])],
      chips: ["詳しくはこちら", "Dateで決めました"],
    });
  }
  return ogImage({
    eyebrow: "日にちとお店を決めます",
    title: party.title,
    lines: [
      ...(party.start !== null ? [`${clock(party.start)}から始めます`] : []),
      "行ける日と予算を、30秒で答えてください",
    ],
    chips: [`候補の日 ${party.dates.length}日`, "答える"],
  });
}
