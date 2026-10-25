import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CollectionView } from "@/components/CollectionView";
import { SiteHeader } from "@/components/SiteHeader";
import { getStore } from "@/lib/store";
import { verifyToken } from "@/lib/tokens";
import { PageMotion } from "@/components/PageMotion";

// 集金のページ。参加した人は自分の「払った」を押し、幹事(鍵の入った URL)は受け取りを記録して催促を送る

export const metadata: Metadata = { title: "集金", robots: { index: false } };

export default async function CollectionPage(props: PageProps<"/c/[id]">) {
  await connection();
  const { id } = await props.params;
  const { token } = await props.searchParams;
  let collection;
  try {
    collection = await getStore().getCollection(id);
  } catch (e) {
    console.error("[collection] 読めませんでした", e);
    collection = null;
  }
  if (!collection) notFound();
  const { adminHash, ...view } = collection;
  const hostToken = typeof token === "string" && verifyToken(token, adminHash) ? token : null;

  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl pb-16">
        <CollectionView collection={view} hostToken={hostToken} />
      </div>
    </PageMotion>
  );
}
