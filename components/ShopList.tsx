"use client";

import { Check, ChevronDown, Cigarette, CigaretteOff, ExternalLink, Heart, MapPin, Store } from "lucide-react";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { useState } from "react";
import { mapsUrl } from "@/lib/maps";
import type { Shop } from "@/lib/shops";
import { areaLabel } from "@/lib/sendai";
import { PrNote } from "./PrNote";

const SMOKING_LABEL = { ok: "喫煙可", partial: "分煙", no: "全面禁煙" } as const;

// 予算・場所・人数に合うお店。お店のページへは /go を通す(押された数を数える)

export function ShopList({
  partyId,
  shops,
  otherArea,
  chosenId,
  heading = "合いそうなお店",
  lead,
  notice,
  basis,
  id = "shops",
  children,
  empty,
  initial = 5,
}: {
  partyId: string;
  shops: Shop[];
  otherArea: boolean;
  chosenId?: string | null;
  /** 二次会のように別の一覧として出すときの見出しと説明 */
  heading?: string;
  lead?: string;
  /** 予約のときにお店に伝えること(苦手なもの・お酒を飲まない人の数) */
  notice?: string | null;
  /** 何に合わせて選んだか(人数・予算・場所など)。チップで並べる */
  basis?: string[];
  id?: string;
  /** 説明の下に置くもの(絞り込みのボタンなど) */
  children?: React.ReactNode;
  /** お店がないときの一言。なければ一覧ごと出さない */
  empty?: string;
  /** 最初に見せる数。残りは「もっと見る」で出す */
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const favorites = useFavorites();
  if (shops.length === 0 && !empty) return null;
  const isSample = shops.some((s) => s.sample);
  return (
    <section id={id} className="mt-4 mx-4 rounded-3xl border panel px-4 py-6">
      <h2 className="text-lg font-black">{heading}</h2>
      <p className="mt-1 text-sm text-muted">
        {lead ?? (otherArea ? "その場所に合うお店がなく、近くのエリアから" : "みんなの答えから自動で選んだお店")}
      </p>
      {basis && basis.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="おすすめの条件">
          {basis.map((b) => (
            <li key={b} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent ring-1 ring-accent/30">
              <Check className="size-3" aria-hidden />
              {b}
            </li>
          ))}
        </ul>
      )}
      {notice && (
        <p className="mt-3 rounded-xl border border-[#ff9da3]/40 px-3 py-2 text-xs font-bold text-[#ffb3b8]">
          予約のときに伝えること: {notice}
        </p>
      )}
      {children}
      {shops.length === 0 && empty && <p className="mt-4 text-sm text-muted">{empty}</p>}
      {isSample && (
        <p className="mt-2 rounded-xl bg-match-soft px-3 py-2 text-xs font-bold text-match-text">
          実在しない見本のお店
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {(expanded ? shops : shops.slice(0, initial)).map((s, i) => (
          <li key={s.id} style={{ "--i": i } as React.CSSProperties} className={`anim-stagger relative rounded-2xl border p-4 ${chosenId === s.id ? "border-match bg-match-soft" : "border-border"}`}>
            {/* お気に入り。押すと、この端末の「お気に入りのお店」に入る(見本のお店は実在しないので出さない) */}
            {!s.sample && (() => {
              const fav = favorites.some((f) => f.id === s.id);
              return (
                <button
                  type="button"
                  aria-pressed={fav}
                  aria-label={fav ? `${s.name}をお気に入りから外す` : `${s.name}をお気に入りに入れる`}
                  onClick={() => toggleFavorite({ id: s.id, name: s.name, genre: s.genre, access: s.access, budgetLabel: s.budgetLabel })}
                  className={`absolute top-2 right-2 grid size-11 place-items-center rounded-full transition active:scale-90 ${fav ? "text-[#ff6b74]" : "text-white/35 hover:text-white/70"}`}
                >
                  <Heart className={`size-5 ${fav ? "fill-current" : ""}`} aria-hidden />
                </button>
              );
            })()}
            <div className="flex items-start gap-3 pr-9">
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
                <p className="font-black">{s.name}</p>
                <p className="text-xs text-muted">
                  {/* 実際のお店は、場所を最寄り駅からの道のりで示す(エリア名は検索の条件で、お店の住所とずれることがある) */}
                  {s.sample ? `${s.genre} ・ ${areaLabel(s.area)} ・ ${s.access}` : `${s.genre} ・ ${s.access}`}
                </p>
                <p className="mt-1 text-sm font-bold">{s.budgetLabel}</p>
                {(s.features.length > 0 || s.smoking) && (
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {s.features.map((f) => (
                      <li key={f} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                        {f}
                      </li>
                    ))}
                    {s.smoking && (
                      <li className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                        {s.smoking === "no" ? <CigaretteOff className="size-3" aria-hidden /> : <Cigarette className="size-3" aria-hidden />}
                        {SMOKING_LABEL[s.smoking]}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <a
              href={`/go/${partyId}/${s.id}`}
              className="mt-3 flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border text-sm font-bold"
              // お店のページは新しいタブで開き、Date の画面(選んだ条件や回答)をそのまま残す
              target="_blank"
              rel="nofollow noopener"
            >
              {s.sample ? "見本のため、お店のページなし" : "お店のページで予約する"}
              {!s.sample && <ExternalLink className="size-4" aria-hidden />}
            </a>
            {/* 場所や口コミは Google マップで見てもらう(見本のお店は実在しないので出さない) */}
            {!s.sample && (
              <a
                href={mapsUrl(s.name)}
                target="_blank"
                rel="noopener"
                className="mt-2 flex min-h-11 items-center justify-center gap-1 rounded-xl text-sm font-bold text-muted transition-colors hover:text-text"
              >
                <MapPin className="size-4" aria-hidden />
                Google マップで場所と口コミを見る
              </a>
            )}
          </li>
        ))}
      </ul>
      {!expanded && shops.length > initial && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-white/15 text-sm font-bold transition-transform active:scale-[0.98]"
        >
          もっと見る(あと{shops.length - initial}軒)
          <ChevronDown className="size-4" aria-hidden />
        </button>
      )}
      {!isSample && <PrNote className="mt-3" />}
      {/* ホットペッパーの規約で、クレジットと、写真を使うときの「画像提供」の表示が必要 */}
      {!isSample && (
        <p className="mt-3 text-xs text-muted">
          Powered by{" "}
          <a href="http://webservice.recruit.co.jp/" className="underline">
            ホットペッパーグルメ Webサービス
          </a>
          <br />
          画像提供:ホットペッパー グルメ
        </p>
      )}
    </section>
  );
}
