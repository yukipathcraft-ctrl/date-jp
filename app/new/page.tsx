import type { Metadata } from "next";
import { CreateForm } from "@/components/CreateForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "会をつくる" };

export default function NewPage() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 pt-6 pb-16">
        <h1 className="text-2xl font-extrabold tracking-tight">会をつくる</h1>
        <p className="mt-1 mb-5 text-sm text-muted">できたURLをLINEのグループに貼れば、みんながそこから答えられます</p>
        <CreateForm />
      </div>
    </>
  );
}
