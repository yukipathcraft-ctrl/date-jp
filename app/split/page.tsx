import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SplitClient } from "@/components/SplitClient";
import { PageMotion } from "@/components/PageMotion";

export const metadata: Metadata = { title: "会計" };

export default function SplitPage() {
  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">会計</h1>
          <p className="mt-1 text-sm text-muted">合計を入れると割り勘の金額がすぐに出ます。先輩は多めなどの傾斜や、集金のチェックもできます</p>
        </div>
        <SplitClient />
      </div>
    </PageMotion>
  );
}
