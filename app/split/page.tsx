import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { StepBar } from "@/components/StepBar";
import { SplitClient } from "@/components/SplitClient";
import { PageMotion } from "@/components/PageMotion";

export const metadata: Metadata = { title: "会計" };

// 会の画面から来たときだけ、上に「日程調整 → お店探し → 会計精算」の段階を出す(ただ計算したいときは出さない)
export default async function SplitPage(props: PageProps<"/split">) {
  const { from } = await props.searchParams;
  return (
    <PageMotion>
      {typeof from === "string" ? (
        <SiteHeader>
          <StepBar current={2} />
        </SiteHeader>
      ) : (
        <SiteHeader />
      )}
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-[22px] font-black tracking-tight">会計</h1>
          <p className="mt-1 text-sm text-muted">合計を入れるだけで、一人ずつの金額を表示。傾斜や集金のチェックも</p>
        </div>
        <SplitClient from={typeof from === "string" ? from : null} />
      </div>
    </PageMotion>
  );
}
