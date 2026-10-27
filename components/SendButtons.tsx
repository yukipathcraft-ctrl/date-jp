"use client";

import { Check, Copy, MessagesSquare, Send, Share } from "lucide-react";
import { useEffect, useState } from "react";
import type { Audience } from "@/lib/audience";
import { lineShareUrl, teamsShareUrl } from "@/lib/share";
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
export function SendButtons({ mainLabel, line, share, copy, copyLabel = "URLをコピー", canShare, audience = "student" }: {
  mainLabel: string;
  line: string;
  share: ShareData;
  copy: string;
  /** 共有の画面がないときの、大きなコピーのボタンの文字 */
  copyLabel?: string;
  canShare: boolean;
  /** 社会人の会は LINE ではなく Slack・Teams で送ることが多いので、送り方を変える */
  audience?: Audience;
}) {
  if (audience === "worker") return <WorkSendButtons mainLabel={mainLabel} text={line} share={share} canShare={canShare} />;
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

/**
 * 社会人の会の送り方。仕事の連絡は Teams が多いので、どこでも「Teamsで送る」をいちばん大きくし、LINE は出さない。
 * Slack・Chatwork には外から文を入れて開く仕組みがないので、送る文をまるごとコピーして貼ってもらう
 */
function WorkSendButtons({ mainLabel, text, share, canShare }: { mainLabel: string; text: string; share: ShareData; canShare: boolean }) {
  return (
    <div className="mt-4 space-y-2">
      <a href={teamsShareUrl(text)} target="_blank" rel="noopener" className={`${BUTTON_PRIMARY} w-full gap-2`}>
        <MessagesSquare className="size-5 shrink-0" aria-hidden />
        Teamsで送る
      </a>
      {canShare ? (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={BUTTON_HALF} onClick={() => navigator.share(share).catch(() => {})}>
            <Share className="size-4 shrink-0" aria-hidden />
            {mainLabel.startsWith("共有") ? "共有" : mainLabel}
          </button>
          <CopyButton text={text} label="文をコピー" className={BUTTON_HALF} />
        </div>
      ) : (
        <CopyButton text={text} label="文をコピー(Slackなどに貼る)" className={`${BUTTON_SUB} w-full gap-2 text-sm`} />
      )}
    </div>
  );
}
