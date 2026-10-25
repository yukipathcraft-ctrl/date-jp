import { ExternalLink, Store } from "lucide-react";
import type { Shop } from "@/lib/shops";
import { areaLabel } from "@/lib/sendai";

// 予算・場所・人数に合うお店。お店のページへは /go を通す(押された数を数える)

export function ShopList({
  partyId,
  shops,
  otherArea,
  chosenId,
}: {
  partyId: string;
  shops: Shop[];
  otherArea: boolean;
  chosenId?: string | null;
}) {
  if (shops.length === 0) return null;
  const isSample = shops.some((s) => s.sample);
  return (
    <section id="shops" className="mt-4 border-y border-border bg-surface px-4 py-6">
      <h2 className="text-lg font-extrabold">合いそうなお店</h2>
      <p className="mt-1 text-sm text-muted">
        {otherArea ? "その場所で合うお店がなかったので、近くのエリアから出しています。" : "予算・場所・人数で選んでいます。"}
      </p>
      {isSample && (
        <p className="mt-2 rounded-xl bg-match-soft px-3 py-2 text-xs font-bold text-match-text">
          いまは見本のお店です(実在しません)。お店のデータをつなぐと、仙台の実際のお店が出ます。
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {shops.map((s) => (
          <li key={s.id} className={`rounded-2xl border p-4 ${chosenId === s.id ? "border-match bg-match-soft" : "border-border"}`}>
            <div className="flex items-start gap-3">
              {s.photo ? (
                // 外のお店の写真。最適化は使わない
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-surface-2">
                  <Store className="size-6 text-muted" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                {chosenId === s.id && <p className="text-xs font-bold text-match-text">★ このお店に決定</p>}
                <p className="font-extrabold">{s.name}</p>
                <p className="text-xs text-muted">
                  {s.genre} ・ {areaLabel(s.area)} ・ {s.access}
                </p>
                <p className="mt-1 text-sm font-bold">{s.budgetLabel}</p>
                {s.features.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {s.features.map((f) => (
                      <li key={f} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <a
              href={`/go/${partyId}/${s.id}`}
              className="mt-3 flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border text-sm font-bold"
              rel="nofollow"
            >
              {s.sample ? "見本のため、お店のページはありません" : "お店のページで予約する"}
              {!s.sample && <ExternalLink className="size-4" aria-hidden />}
            </a>
          </li>
        ))}
      </ul>
      {!isSample && <p className="mt-3 text-xs text-muted">Powered by <a href="http://webservice.recruit.co.jp/" className="underline">ホットペッパーグルメ Webサービス</a></p>}
    </section>
  );
}
