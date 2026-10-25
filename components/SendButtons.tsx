"use client";

import { Check, Copy, Send, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { lineShareUrl } from "@/lib/share";
import { BUTTON_LINE, BUTTON_PRIMARY, BUTTON_SUB } from "./ui";

/** 大きなボタンの下に半分の幅で並べる、控えめなボタン */
const BUTTON_HALF = `${BUTTON_SUB} min-w-0 gap-1.5 whitespace-nowrap px-2 text-sm`;

/** スマホの共有の画面(Slack・メモ・メールなど)を開けるか。開けないパソコンではコピーを大きくする */
export function useCanShare(): boolean {
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator.share === "function");
  }, []);
  return canShare;
}

function CopyButton({ text, label, className }: { text: string; label: string; className: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {}
      }}
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {done ? "コピーしました" : label}
    </button>
  );
}

/**
 * 送り方のボタン。共有の画面(LINE・Slack・メール・メモなどから選べる)を大きく置き、
 * その下に、1回で送り先を選べる LINE と、コピーを半分の幅で並べる。
 * 共有の画面がないパソコンでは、コピーを大きくし、下は LINE だけにする
 */
export function SendButtons({ mainLabel, line, share, copy, copyLabel = "URLをコピー", canShare }: {
  mainLabel: string;
  line: string;
  share: ShareData;
  copy: string;
  /** 共有の画面がないときの、大きなコピーのボタンの文字 */
  copyLabel?: string;
  canShare: boolean;
}) {
  const lineButton = (
    <a href={lineShareUrl(line)} className={canShare ? `${BUTTON_LINE} min-w-0 gap-1.5 whitespace-nowrap px-2 text-sm` : `${BUTTON_LINE} w-full gap-2 text-sm`}>
      <Send className="size-4 shrink-0" aria-hidden />
      {canShare ? "LINE" : "LINEで送る"}
    </a>
  );
  return (
    <div className="mt-4 space-y-2">
      {canShare ? (
        <>
          <button type="button" className={`${BUTTON_PRIMARY} w-full gap-2`} onClick={() => navigator.share(share).catch(() => {})}>
            <Share className="size-5" aria-hidden />
            {mainLabel}
          </button>
          <div className="grid grid-cols-2 gap-2">
            {lineButton}
            <CopyButton text={copy} label="コピー" className={BUTTON_HALF} />
          </div>
        </>
      ) : (
        <>
          <CopyButton text={copy} label={copyLabel} className={`${BUTTON_PRIMARY} w-full gap-2`} />
          {lineButton}
        </>
      )}
    </div>
  );
}
