import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { PageMotion } from "@/components/PageMotion";

export default function NotFound() {
  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-xl font-black">ページが見つかりません</h1>
        <p className="mt-2 text-sm text-muted">URLが途中で切れていないか確かめてください</p>
        <Link href="/" className="mt-4 inline-block font-bold underline">
          トップへ
        </Link>
      </div>
    </PageMotion>
  );
}
