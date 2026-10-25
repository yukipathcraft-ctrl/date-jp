"use client";

import { CalendarDays, Check, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createParty } from "@/app/actions";
import { AUDIENCES, loadAudience, type Audience } from "@/lib/audience";
import { rememberParty } from "@/lib/myParties";
import { dateLabel, upcomingDates, weekdayOf } from "@/lib/sendai";
import { MAX_DATES } from "@/lib/validation";
import { BUTTON_PRIMARY, INPUT, LABEL, PILL, PILL_OFF, PILL_ON } from "./ui";

export function saveAdminToken(partyId: string, token: string) {
  try {
    localStorage.setItem(`nomise:admin:${partyId}`, token);
  } catch {}
}

export function CreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience>("student");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // 今日から3週間ぶん。日付はブラウザで開いたときに作る
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setOptions(upcomingDates(new Date(), 21));
    setAudience(loadAudience() ?? "student");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle(d: string) {
    setDates((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : cur.length < MAX_DATES ? [...cur, d] : cur));
  }

  function submit() {
    setError(null);
    start(async () => {
      const result = await createParty({ title, audience, dates });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      saveAdminToken(result.id, result.adminToken);
      rememberParty({ id: result.id, title: title.trim(), token: result.adminToken, createdAt: Date.now() });
      router.push(`/p/${result.id}/admin?token=${result.adminToken}&created=1`);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <label className="block border-b border-border px-5 py-5">
          <span className={LABEL}>
            <PenLine className="size-4" aria-hidden />
            飲み会の名前
          </span>
          <input
            className={INPUT}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={audience === "student" ? "例: ゼミの打ち上げ" : "例: 部署の歓迎会"}
            maxLength={40}
          />
        </label>

        <div className="px-5 py-5">
          <p className={LABEL}>
            <CalendarDays className="size-4" aria-hidden />
            候補の日 <span className="font-normal">(最大{MAX_DATES}つ)</span>
          </p>
          <div className="grid min-h-48 grid-cols-3 gap-2 min-[400px]:grid-cols-4">
            {options.map((d) => {
              const on = dates.includes(d);
              const w = weekdayOf(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(d)}
                  aria-pressed={on}
                  className={`${PILL} px-2 ${on ? PILL_ON : PILL_OFF} ${!on && w === 0 ? "text-danger" : ""} ${
                    !on && w === 6 ? "text-[#7fb2ff]" : ""
                  }`}
                >
                  {on && <Check className="size-3.5" aria-hidden />}
                  {dateLabel(d)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      <button type="button" onClick={submit} disabled={pending} className={`${BUTTON_PRIMARY} mt-6 w-full`}>
        {pending ? "作っています…" : "URLを作る"}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        登録はいりません。{AUDIENCES[audience].label}向けの予算と時間で聞きます。
      </p>
    </>
  );
}
