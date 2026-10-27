import type { Metadata } from "next";
import { CreateForm } from "@/components/CreateForm";
import { SiteHeader } from "@/components/SiteHeader";
import { PageMotion } from "@/components/PageMotion";
import { StepBar } from "@/components/StepBar";

export const metadata: Metadata = { title: "会をつくる" };

export default function NewPage() {
  return (
    <PageMotion>
      <SiteHeader>
        <StepBar current={0} />
      </SiteHeader>
      <div className="mx-auto max-w-xl px-4 pt-6">
        <h1 className="px-0.5 text-[22px] font-black tracking-tight">候補の日を選ぶ</h1>
        <p className="mt-1 mb-5 px-0.5 text-[11px] font-semibold text-muted">
          できたURLをLINEのグループに貼れば、みんながそこから答えられます
        </p>
        <CreateForm />
      </div>
    </PageMotion>
  );
}
