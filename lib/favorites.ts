"use client";

import { useEffect, useState } from "react";

// お気に入りのお店。ログインがないので、この端末(ブラウザ)にだけ残す。
// お店の一覧で ♡ を押すと入り、「お店を探す」の上にまとめて出る

export type FavoriteShop = { id: string; name: string; genre: string; access: string; budgetLabel: string };

const KEY = "nomi:favorites";
/** ほかの画面の ♡ も同じに変えるための合図 */
const EVENT = "nomi:favorites";
const MAX = 50;

export function loadFavorites(): FavoriteShop[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function save(list: FavoriteShop[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

/** 入っていれば外し、なければ先頭に入れる */
export function toggleFavorite(shop: FavoriteShop) {
  const list = loadFavorites();
  save(list.some((f) => f.id === shop.id) ? list.filter((f) => f.id !== shop.id) : [shop, ...list]);
}

/** お気に入りの一覧。どこかで ♡ が押されたら読み直す */
export function useFavorites(): FavoriteShop[] {
  const [list, setList] = useState<FavoriteShop[]>([]);
  useEffect(() => {
    const read = () => setList(loadFavorites());
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return list;
}
