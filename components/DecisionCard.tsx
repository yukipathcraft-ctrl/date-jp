import { PartyPopper } from "lucide-react";
import { clock, dateLabel } from "@/lib/sendai";
import type { Decision } from "@/lib/store/types";

export function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <section className="anim-rise border-y border-match bg-match-soft px-4 py-6 text-center">
      <p className="flex items-center justify-center gap-2 text-sm font-bold text-match-text">
        <PartyPopper className="size-4" aria-hidden />
        決まりました!
      </p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">
        {dateLabel(decision.date)} {clock(decision.start)}〜
      </p>
      {decision.shopName && <p className="mt-1 text-lg font-bold">{decision.shopName}</p>}
    </section>
  );
}
