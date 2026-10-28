"use client";

import { Check, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setMust } from "@/app/actions";
import { PILL, PILL_OFF, PILL_ON } from "./ui";

// 幹事の画面で「必ず来てほしい人」(部長・主役など)を選ぶ。選んだ人が行ける日を、日にちの候補の先頭に出す。
// 答えた人の中から選ぶ(まだ答えていない人は選べない)

export function MustPicker({ partyId, token, names, must }: { partyId: string; token: string; names: string[]; must: string[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(name: string) {
    const next = must.includes(name) ? must.filter((n) => n !== name) : [...must, name];
    setError(null);
    start(async () => {
      const r = await setMust(partyId, token, next);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-sm font-bold">
        <Crown className="size-4 text-accent" aria-hidden />
        必ず来てほしい人
      </p>
      <p className="mt-0.5 text-xs text-muted">部長や主役など。選ぶと、その人が行ける日を先に出します</p>
      <div className={`mt-2 flex flex-wrap gap-2 ${pending ? "opacity-60" : ""}`} role="group" aria-label="必ず来てほしい人">
        {names.map((n) => {
          const on = must.includes(n);
          return (
            <button key={n} type="button" disabled={pending} aria-pressed={on} onClick={() => toggle(n)} className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}>
              {on && <Check className="size-3.5" aria-hidden />}
              {n}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
