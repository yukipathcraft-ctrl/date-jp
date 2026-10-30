import type { Metadata } from "next";
import { HistoryClient } from "@/components/HistoryClient";
import { PageMotion } from "@/components/PageMotion";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "これまでの会", robots: { index: false } };

// これまでの会の記録。この端末で作った会だけを出す(記録はブラウザの中にある)
export default function HistoryPage() {
  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-[22px] font-black tracking-tight">これまでの会</h1>
          <p className="mt-1 text-sm text-muted">前の会のお店・人数・金額の記録。毎年の会は「この会をもとに作る」から</p>
        </div>
        <HistoryClient />
      </div>
    </PageMotion>
  );
}
