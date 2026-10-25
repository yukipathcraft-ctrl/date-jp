import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SplitClient } from "@/components/SplitClient";

export const metadata: Metadata = { title: "傾斜会計" };

export default function SplitPage() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">傾斜会計</h1>
          <p className="mt-1 text-sm text-muted">先輩は多め、飲まない人は少なめ。合計を入れると1人ずつの金額が出ます。</p>
        </div>
        <SplitClient />
      </div>
    </>
  );
}
