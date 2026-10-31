"use client";

import { Check, Copy, Mic, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { Audience } from "@/lib/audience";
import { greeting, occasionFromTitle, OCCASIONS, type GreetingKind, type Occasion } from "@/lib/greeting";
import { BUTTON_SUB, PILL, PILL_OFF, PILL_ON } from "./ui";

// 乾杯と締めの挨拶。会の名前から場面を選んでおき、「別の案」で言い回しを変える

const KINDS: { key: GreetingKind; label: string }[] = [
  { key: "kanpai", label: "乾杯" },
  { key: "shime", label: "締め" },
];

export function GreetingCard({ title, audience }: { title: string; audience: Audience }) {
  const [kind, setKind] = useState<GreetingKind>("kanpai");
  const [occasion, setOccasion] = useState<Occasion>(() => occasionFromTitle(title));
  const [variant, setVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const text = greeting({ kind, audience, occasion, title, variant });

  return (
    <section className="mt-4 mx-4 rounded-3xl border panel px-4 py-6">
      <p className="flex items-center gap-2 text-lg font-black">
        <Mic className="size-5" aria-hidden />
        挨拶の文
      </p>
      <p className="mt-1 text-sm text-muted">乾杯と締めのひとこと</p>

      <div className="mt-4 grid grid-cols-2 gap-1.5" role="group" aria-label="挨拶の種類">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            aria-pressed={kind === k.key}
            onClick={() => {
              setKind(k.key);
              setVariant(0);
            }}
            className={`${PILL} ${kind === k.key ? PILL_ON : PILL_OFF}`}
          >
            {kind === k.key && <Check className="size-3.5" aria-hidden />}
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="会の場面">
        {OCCASIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={occasion === o.key}
            onClick={() => {
              setOccasion(o.key);
              setVariant(0);
            }}
            className={`${PILL} px-3 text-xs ${occasion === o.key ? PILL_ON : PILL_OFF}`}
          >
            {occasion === o.key && <Check className="size-3" aria-hidden />}
            {o.label}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-4 whitespace-pre-line rounded-2xl bg-surface-2 px-4 py-4 text-[15px] leading-relaxed font-bold">
        {text}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setVariant((v) => v + 1)} className={`${BUTTON_SUB} gap-1.5 text-sm`}>
          <RefreshCw className="size-4" aria-hidden />
          別の案
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
          className={`${BUTTON_SUB} gap-1.5 text-sm`}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
    </section>
  );
}
