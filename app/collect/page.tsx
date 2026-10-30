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
          <p className="mt-1 text-sm text-muted">幹事が「受け取った」を押すだけで、誰が払ったかが一目瞭然</p>
        </div>
        <CollectList />
      </div>
    </PageMotion>
  );
}
