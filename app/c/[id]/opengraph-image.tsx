import { OG_SIZE, ogImage } from "@/lib/og";
import { yen } from "@/lib/sendai";
import { getStore } from "@/lib/store";

// 集金の URL を LINE に貼ったときのカード。合計と人数だけを出し、誰が払ったかは出さない

export const alt = "Date の集金";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getStore()
    .getCollection(id)
    .catch(() => null);
  if (!c) {
    return ogImage({ eyebrow: "集金", title: "見つかりませんでした" });
  }
  return ogImage({
    eyebrow: "お会計の集金",
    title: c.title || "お会計",
    lines: ["金額を確かめて、払ったら自分の名前の「払った」を押してください"],
    chips: [`合計 ${yen(c.total)}`, `${c.people.length}人`],
  });
}
