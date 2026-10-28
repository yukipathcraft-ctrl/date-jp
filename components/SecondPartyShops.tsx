"use client";

import { Check } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { findSecondShops } from "@/app/actions";
import { SECOND_GENRES, type SecondGenreKey } from "@/lib/sendai";
import type { Shop } from "@/lib/shops";
import { ShopList } from "./ShopList";
import { PILL, PILL_OFF, PILL_ON } from "./ui";

// 二次会のお店。一次会のお店が決まったあとに、その近くで23時以降も開いているお店を出す。
// 種類(居酒屋・バー・カラオケ)を押すと、その場で探し直す

export function SecondPartyShops({ partyId }: { partyId: string }) {
  const [genre, setGenre] = useState<SecondGenreKey | null>(null);
  const [result, setResult] = useState<{ shops: Shop[]; size: number; near: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => {
      setResult(await findSecondShops(partyId, genre));
    });
  }, [partyId, genre]);

  if (result && !result.near) return null;

  return (
    <div className={`transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      <ShopList
        id="second-party"
        partyId={partyId}
        shops={result?.shops ?? []}
        otherArea={false}
        heading="二次会のお店"
        // 決まったあとの画面を長くしないよう、最初は3軒だけ
        initial={3}
        lead={
          result
            ? `${result.near}の近くで、23時以降も開いているお店です(${result.size}人)`
            : "一次会のお店の近くで、遅くまで開いているお店を探しています"
        }
        empty={result ? "合うお店が見つかりませんでした。種類を変えてみてください" : "探しています…"}
      >
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="二次会のお店の種類">
          <button type="button" aria-pressed={genre === null} onClick={() => setGenre(null)} className={`${PILL} ${genre === null ? PILL_ON : PILL_OFF}`}>
            {genre === null && <Check className="size-3.5" aria-hidden />}
            なんでも
          </button>
          {SECOND_GENRES.map((g) => (
            <button
              key={g.key}
              type="button"
              aria-pressed={genre === g.key}
              onClick={() => setGenre(g.key)}
              className={`${PILL} ${genre === g.key ? PILL_ON : PILL_OFF}`}
            >
              {genre === g.key && <Check className="size-3.5" aria-hidden />}
              {g.label}
            </button>
          ))}
        </div>
      </ShopList>
    </div>
  );
}
