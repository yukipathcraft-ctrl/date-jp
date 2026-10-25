import type { Metadata } from "next";
import { ShopSearch } from "@/components/ShopSearch";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "お店を探す" };

export default function ShopsPage() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">お店を探す</h1>
          <p className="mt-1 text-sm text-muted">仙台のお店を、エリア・予算・個室で探せます。</p>
        </div>
        <ShopSearch />
      </div>
    </>
  );
}
