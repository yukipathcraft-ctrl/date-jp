"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createParty } from "@/app/actions";
import { dateLabel, upcomingDates, weekdayOf } from "@/lib/sendai";
import { MAX_DATES } from "@/lib/validation";
import { BUTTON_PRIMARY, INPUT } from "./ui";

export function saveAdminToken(partyId: string, token: string) {
  try {
    localStorage.setItem(`nomise:admin:${partyId}`, token);
  } catch {}
}

export function CreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // 今日から3週間ぶん。トップは前もって作っておくページなので、日付はブラウザで開いたときに作る
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptions(upcomingDates(new Date(), 21));
  }, []);

  function toggle(d: string) {
    setDates((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : cur.length < MAX_DATES ? [...cur, d] : cur));
  }

  function submit() {
    setError(null);
    start(async () => {
      const result = await createParty({ title, dates });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      saveAdminToken(result.id, result.adminToken);
      router.push(`/p/${result.id}/admin?token=${result.adminToken}&created=1`);
    });
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="mb-2 block text-sm font-bold">① 飲み会の名前</span>
        <input
          className={INPUT}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: ゼミの打ち上げ"
          maxLength={40}
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-bold">
          ② 候補の日 <span className="font-normal text-muted">(最大{MAX_DATES}つ)</span>
        </p>
        <div className="grid min-h-48 grid-cols-4 gap-2">
          {options.map((d) => {
            const on = dates.includes(d);
            const w = weekdayOf(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggle(d)}
                aria-pressed={on}
                className={`flex min-h-12 items-center justify-center gap-1 rounded-xl border text-sm font-bold transition-colors ${
                  on ? "border-accent bg-accent text-accent-text" : "border-border bg-surface"
                } ${!on && w === 0 ? "text-danger" : ""} ${!on && w === 6 ? "text-[#0a5cff]" : ""}`}
              >
                {on && <Check className="size-3.5" aria-hidden />}
                {dateLabel(d)}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-danger">
          {error}
        </p>
      )}
      <button type="button" onClick={submit} disabled={pending} className={`${BUTTON_PRIMARY} w-full`}>
        {pending ? "作っています…" : "URLを作る"}
      </button>
    </div>
  );
}
