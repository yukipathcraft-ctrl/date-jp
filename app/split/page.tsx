import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { StepBar } from "@/components/StepBar";
import { SplitClient } from "@/components/SplitClient";
import { PageMotion } from "@/components/PageMotion";

export const metadata: Metadata = { title: "会計" };

export default function SplitPage() {
  return (
    <PageMotion>
      <SiteHeader>
        <StepBar current={2} />
      </SiteHeader>
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-[22px] font-black tracking-tight">会計</h1>
          <p className="mt-1 text-sm text-muted">合計を入れて一人ずつ傾斜を選ぶと、払う金額がすぐに出ます。全員同じ額の割り勘や、集金のチェックもできます</p>
        </div>
        <SplitClient />
      </div>
    </PageMotion>
  );
}
