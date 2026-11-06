import type { Metadata } from "next";
import { connection } from "next/server";
import { SiteHeader } from "@/components/SiteHeader";
import { PageMotion } from "@/components/PageMotion";
import { licenseForSession } from "@/lib/billing";
import { ProDone } from "./ProDone";

// Stripe で買ったあとに戻ってくるページ。Stripe に支払いを確かめてから、この端末に鍵を保存して、元のページへ戻す

export const metadata: Metadata = { title: "購入ありがとうございます", robots: { index: false } };

export default async function ProDonePage(props: PageProps<"/pro/done">) {
  await connection();
  const { session, back } = await props.searchParams;
  let license: string | null = null;
  try {
    license = typeof session === "string" ? await licenseForSession(session) : null;
  } catch (e) {
    console.error("[billing] 支払いを確かめられませんでした", e);
  }
  const to = typeof back === "string" && /^\/[A-Za-z0-9/_?=&.-]*$/.test(back) && !back.startsWith("//") ? back : "/split";
  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 py-10">
        <ProDone license={license} back={to} />
      </div>
    </PageMotion>
  );
}
