"use client";

import { ExternalLink, Heart, MapPin } from "lucide-react";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { mapsUrl } from "@/lib/maps";

// 「お店を探す」のいちばん上に出す、お気に入りのお店。♡ を押すと外せる。お気に入りがなければ出さない

export function FavoriteShops() {
  const favorites = useFavorites();
  if (favorites.length === 0) return null;
  return (
    <section className="mx-4 mb-4 rounded-3xl border panel px-4 py-5">
      <h2 className="flex items-center gap-2 font-black">
        <Heart className="size-5 fill-current text-[#ff6b74]" aria-hidden />
        お気に入りのお店
        <span className="text-sm font-bold text-muted">{favorites.length}</span>
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {favorites.map((f) => (
          <li key={f.id} className="flex items-center gap-2 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{f.name}</p>
              <p className="truncate text-xs text-muted">
                {f.genre} ・ {f.budgetLabel}
              </p>
            </div>
            <a
              href={mapsUrl(f.name)}
              target="_blank"
              rel="noopener"
              aria-label={`${f.name}の地図`}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:text-text"
            >
              <MapPin className="size-4" aria-hidden />
            </a>
            <a
              href={`/go/search/${f.id}`}
              target="_blank"
              rel="nofollow noopener"
              aria-label={`${f.name}のお店のページ`}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:text-text"
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => toggleFavorite(f)}
              aria-label={`${f.name}をお気に入りから外す`}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-[#ff6b74]"
            >
              <Heart className="size-5 fill-current" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
