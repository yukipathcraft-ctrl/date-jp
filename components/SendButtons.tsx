"use client";

import { Check, Copy, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { BUTTON_PRIMARY } from "./ui";

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
 * 送り方のボタン。学生も社会人も、共有のボタンひとつにする(LINE・Slack・Teams・メールなど、送り先はスマホの共有の画面で選ぶ)。
 * 共有の画面がないパソコンでは、同じ場所のボタンで送る文をコピーする
 */
export function SendButtons({ mainLabel, share, copy, copyLabel = "URLをコピー", canShare }: {
  mainLabel: string;
  share: ShareData;
  copy: string;
  /** 共有の画面がないときの、コピーのボタンの文字 */
  copyLabel?: string;
  canShare: boolean;
}) {
  return (
    <div className="mt-4">
      {canShare ? (
        <button type="button" className={`${BUTTON_PRIMARY} w-full gap-2`} onClick={() => navigator.share(share).catch(() => {})}>
          <Share className="size-5" aria-hidden />
          {mainLabel}
        </button>
      ) : (
        <CopyButton text={copy} label={copyLabel} className={`${BUTTON_PRIMARY} w-full gap-2`} />
      )}
    </div>
  );
}
