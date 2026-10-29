import { ExternalLink, MapPin, PartyPopper, Store } from "lucide-react";
import { mapsUrl } from "@/lib/maps";
import { clock, dateLabel } from "@/lib/sendai";
import type { Decision } from "@/lib/store/types";
import { PrNote } from "./PrNote";

// 決まった会のいちばん上。日にち・時間・お店と、お店の予約と場所をここにまとめる
// (決まったあとは、ほかの候補のお店の一覧を出さないので、決まったお店へはここから行く)

/** 見本のお店(s1, s2…)は実在しないので、予約や地図のリンクを出さない */
const isSampleShop = (id: string) => /^s\d+$/.test(id);

export function DecisionCard({ decision, partyId }: { decision: Decision; partyId: string }) {
  const shop = decision.shopId && decision.shopName ? { id: decision.shopId, name: decision.shopName } : null;
  return (
    <section className="anim-rise mx-4 rounded-3xl border border-match bg-match-soft px-4 py-6">
      <p className="flex items-center justify-center gap-2 text-sm font-bold text-match-text">
        <PartyPopper className="size-4" aria-hidden />
        決まりました!
      </p>
      <p className="mt-2 text-center text-3xl font-black tracking-tight">
        {dateLabel(decision.date)} {clock(decision.start)}〜
      </p>
      {shop ? (
        <>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-lg font-bold">
            <Store className="size-5 shrink-0" aria-hidden />
            {shop.name}
          </p>
          {!isSampleShop(shop.id) && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={`/go/${partyId}/${shop.id}`}
                target="_blank"
                rel="nofollow noopener"
                className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-bg/50 px-2 text-sm font-bold"
              >
                お店のページ
                <ExternalLink className="size-4" aria-hidden />
              </a>
              <a
                href={mapsUrl(shop.name)}
                target="_blank"
                rel="noopener"
                className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-bg/50 px-2 text-sm font-bold"
              >
                <MapPin className="size-4" aria-hidden />
                地図
              </a>
            </div>
          )}
          {!isSampleShop(shop.id) && <PrNote className="mt-3" />}
        </>
      ) : (
        <p className="mt-1 text-center text-sm text-muted">お店はこれから決めます</p>
      )}
    </section>
  );
}
