import type { Metadata } from "next";
import { PageMotion } from "@/components/PageMotion";
import { SeatsClient } from "@/components/SeatsClient";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "席決め" };

export default function SeatsPage() {
  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-[22px] font-black tracking-tight">席決め</h1>
          <p className="mt-1 text-sm text-muted">名前を入れてくじを引くだけ。テーブルごとに人数をそろえて席分け</p>
        </div>
        <SeatsClient />
      </div>
    </PageMotion>
  );
}
