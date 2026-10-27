"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// 上のバーの戻るボタン。アプリの中で移ってきたなら前の画面へ、
// LINE のリンクなどから直接開いたなら戻る先がないので、トップへ行く

const KEY = "nomi:pages";

function pagesSeen(): number {
  try {
    return Number(sessionStorage.getItem(KEY) ?? "0");
  } catch {
    return 0;
  }
}

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // このタブで開いた画面の数を数える。2つ以上なら、戻る先がアプリの中にある。
  // 同じ画面を続けて数えないよう、最後に数えた画面を覚えておく
  useEffect(() => {
    try {
      if (sessionStorage.getItem(`${KEY}:last`) === pathname) return;
      sessionStorage.setItem(`${KEY}:last`, pathname);
      sessionStorage.setItem(KEY, String(pagesSeen() + 1));
    } catch {}
  }, [pathname]);

  if (pathname === "/") return null;

  return (
    <button
      type="button"
      aria-label="戻る"
      onClick={() => {
        if (pagesSeen() > 1) router.back();
        else router.push("/");
      }}
      className="-ml-2 grid size-11 shrink-0 place-items-center rounded-xl text-stone-400 transition hover:text-white active:scale-95"
    >
      <ChevronLeft className="size-6" aria-hidden />
    </button>
  );
}
