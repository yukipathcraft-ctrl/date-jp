"use client";

import { Check, ChevronDown, Cigarette, CigaretteOff, ExternalLink, Star, Store, ThumbsUp } from "lucide-react";
import { useState } from "react";
import type { Shop } from "@/lib/shops";
import { countLabel, isHighlyRated, type Rating } from "@/lib/rating";
import { areaLabel } from "@/lib/sendai";

const SMOKING_LABEL = { ok: "喫煙可", partial: "分煙", no: "全面禁煙" } as const;

// 予算・場所・人数に合うお店。お店のページへは /go を通す(押された数を数える)

/**
 * Google の評価。★は Google の数字をそのまま出し、口コミの数を添える。
 * 口コミの数も加味した点が高いお店にだけ「評価が高い」を付ける(色だけでなく、アイコンと文字で示す)
 */
function RatingLine({ rating }: { rating: Rating }) {
  const body = (
    <>
      <Star className="size-3.5 fill-current text-accent" aria-hidden />
      <span className="font-black tabular-nums">{rating.value.toFixed(1)}</span>
      <span className="text-muted">
        (口コミ {countLabel(rating.count)}
        {rating.sample ? "・見本" : "・Google"})
      </span>
    </>
  );
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
      <span className="sr-only">評価</span>
      {rating.mapsUrl ? (
        <a href={rating.mapsUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
          {body}
        </a>
      ) : (
        <span className="inline-flex items-center gap-1">{body}</span>
      )}
      {isHighlyRated(rating) && (
        <span className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-accent/15 px-1.5 py-0.5 text-[11px] font-bold text-accent">
          <ThumbsUp className="size-3" aria-hidden />
          評価が高い
        </span>
      )}
    </p>
  );
}

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
  if (shops.length === 0 && !empty) return null;
  const isSample = shops.some((s) => s.sample);
  return (
    <section id={id} className="mt-4 mx-4 rounded-3xl border panel px-4 py-6">
      <h2 className="text-lg font-black">{heading}</h2>
      <p className="mt-1 text-sm text-muted">
        {lead ?? (otherArea ? "その場所には合うお店がなかったので、近くのエリアから出しています" : "みんなの答えから、自動で選びました")}
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
          今出ているのは実在しない見本のお店で、お店のデータをつなぐと仙台の本物のお店に変わります
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {(expanded ? shops : shops.slice(0, initial)).map((s, i) => (
          <li key={s.id} style={{ "--i": i } as React.CSSProperties} className={`anim-stagger rounded-2xl border p-4 ${chosenId === s.id ? "border-match bg-match-soft" : "border-border"}`}>
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
                <p className="font-black">{s.name}</p>
                {s.rating && <RatingLine rating={s.rating} />}
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
              {s.sample ? "見本なのでお店のページはありません" : "お店のページで予約する"}
              {!s.sample && <ExternalLink className="size-4" aria-hidden />}
            </a>
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
      {shops.some((s) => s.rating) && (
        <p className="mt-3 text-xs text-muted">
          ★は{shops.some((s) => s.rating && !s.rating.sample) ? " Google マップ" : "見本"}の評価です。並び順と「評価が高い」は、口コミの数も加味して決めています(口コミが少ないお店の高い★は、少し割り引いて見ます)
        </p>
      )}
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
