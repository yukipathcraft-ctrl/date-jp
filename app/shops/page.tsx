import type { Metadata } from "next";
import { ShopSearch } from "@/components/ShopSearch";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "お店だけ探す" };

export default function ShopsPage() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-xl pt-6 pb-16">
        <div className="px-4 pb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">お店だけ探す</h1>
          <p className="mt-1 text-sm text-muted">条件を選ぶたびに、下のお店がその場で入れかわります</p>
        </div>
        <ShopSearch />
      </div>
    </>
  );
}
