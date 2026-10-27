"use client";

import { Car, CarFront, ChevronRight, Gift, Mic } from "lucide-react";
import { useEffect } from "react";
import { logAdView } from "@/app/actions";
import type { Sponsor } from "@/lib/sponsors";

// 広告枠。飲み会の流れに合う場所(贈りもの・二次会・帰り・学生のうちに)にだけ出す。
// 広告だと分かるよう、必ず「広告」と書く(ステルスマーケティングにしない)

const HEADING = { gift: "送別会・歓迎会の贈りもの", second: "二次会にどうぞ", ride: "帰りの足に", campus: "学生のうちに" } as const;
const ICON = { gift: Gift, second: Mic, ride: Car, campus: CarFront } as const;

export function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  useEffect(() => {
    // 同じタブで同じ広告を何度も数えない
    const key = `nomi:ad:${sponsor.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    void logAdView(sponsor.id);
  }, [sponsor.id]);

  const Icon = ICON[sponsor.placement];
  return (
    <section className="mx-4 mt-4" aria-label={`広告: ${sponsor.name}`}>
      <p className="mb-2 flex items-center gap-2 px-1 text-[10px] font-black tracking-[0.2em] text-muted">
        {HEADING[sponsor.placement]}
        <span className="rounded border border-white/20 px-1 py-px text-[9px] tracking-normal text-muted">広告</span>
      </p>
      <a
        href={`/ad/${encodeURIComponent(sponsor.id)}`}
        target={sponsor.url.startsWith("tel:") ? undefined : "_blank"}
        rel="sponsored noopener"
        className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 ring-1 ring-border shadow-card transition hover:bg-surface-2 active:scale-[0.99]"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent/40 text-accent">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-black tracking-tight">{sponsor.name}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-muted">{sponsor.catch}</span>
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-accent">
          {sponsor.action}
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </a>
    </section>
  );
}
