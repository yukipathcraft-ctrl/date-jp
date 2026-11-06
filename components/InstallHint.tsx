"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

// ホーム画面に追加する案内。iPhone は自分から案内が出ないので、共有ボタンからの手順を出す。
// Android などは、ブラウザの「インストール」をこのボタンから開く。
// もうホーム画面から開いているとき、閉じたことがあるときは出さない

const KEY = "date:install-hint";

type InstallPrompt = Event & { prompt: () => Promise<void> };

export function InstallHint() {
  const [mode, setMode] = useState<"ios" | "prompt" | null>(null);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    let closed = false;
    try {
      closed = localStorage.getItem(KEY) === "closed";
    } catch {}
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (closed || standalone) return;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ios) setMode("ios");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
      setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function close() {
    try {
      localStorage.setItem(KEY, "closed");
    } catch {}
    setMode(null);
  }

  if (!mode) return null;
  return (
    <div className="relative flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 pr-12 ring-1 ring-white/8">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 text-accent">
        {mode === "ios" ? <Share className="size-4" aria-hidden /> : <Download className="size-4" aria-hidden />}
      </span>
      {mode === "ios" ? (
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/80">
          <span className="block text-[13px] font-black text-white/90">アプリのように使う</span>
          下の共有ボタン → 「ホーム画面に追加」
        </p>
      ) : (
        <button
          type="button"
          onClick={async () => {
            await prompt?.prompt().catch(() => {});
            close();
          }}
          className="min-w-0 flex-1 text-left text-[13px] font-black text-white/90"
        >
          アプリとしてインストール
          <span className="block text-xs font-medium text-white/60">ホーム画面からすぐ開ける</span>
        </button>
      )}
      <button type="button" onClick={close} aria-label="案内を閉じる" className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center text-white/50 hover:text-white/80">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
