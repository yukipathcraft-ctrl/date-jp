import type { Metadata } from "next";
import { CollectList } from "@/components/CollectList";
import { PageMotion } from "@/components/PageMotion";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "集金のチェック" };

export default function CollectPage() {
  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-[22px] font-black tracking-tight">集金のチェック</h1>
          <p className="mt-1 text-sm text-muted">払った人が自分で「払った」を押すので、誰が払ったか一目で分かります</p>
        </div>
        <CollectList />
      </div>
    </PageMotion>
  );
}
