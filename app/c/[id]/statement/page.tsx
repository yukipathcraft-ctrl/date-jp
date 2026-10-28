import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SiteHeader } from "@/components/SiteHeader";
import { StatementView } from "@/components/StatementView";
import { PageMotion } from "@/components/PageMotion";
import { getStore } from "@/lib/store";
import { verifyToken } from "@/lib/tokens";

// 経費精算の明細。名前と金額が並ぶので、幹事(鍵の入った URL)だけが開ける

export const metadata: Metadata = { title: "経費精算の明細", robots: { index: false } };

export default async function StatementPage(props: PageProps<"/c/[id]/statement">) {
  await connection();
  const { id } = await props.params;
  const { token } = await props.searchParams;
  let collection;
  try {
    collection = await getStore().getCollection(id);
  } catch (e) {
    console.error("[statement] 読めませんでした", e);
    collection = null;
  }
  if (!collection) notFound();
  const { adminHash, ...view } = collection;
  const ok = typeof token === "string" && verifyToken(token, adminHash);

  return (
    <PageMotion>
      <div className="print:hidden">
        <SiteHeader />
      </div>
      {ok ? (
        <StatementView collection={view} />
      ) : (
        <div className="mx-auto max-w-xl px-4 pt-10 text-center">
          <h1 className="text-xl font-black">幹事だけが開けるページです</h1>
          <p className="mt-2 text-sm text-muted">集金のページを作った端末で、集金のページの「経費精算の明細」から開いてください</p>
        </div>
      )}
    </PageMotion>
  );
}
