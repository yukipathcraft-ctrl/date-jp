"use client";

import { CalendarDays, Check, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { addTransitionType, startTransition, useEffect, useState, useTransition } from "react";
import { createParty } from "@/app/actions";
import { AUDIENCES, loadAudience, type Audience } from "@/lib/audience";
import { rememberParty } from "@/lib/myParties";
import { dateLabel, upcomingDates, weekdayOf } from "@/lib/sendai";
import { MAX_DATES } from "@/lib/validation";
import { DateCalendar } from "./DateCalendar";
import { BUTTON_PRIMARY, INPUT } from "./ui";

export function saveAdminToken(partyId: string, token: string) {
  try {
    localStorage.setItem(`nomi:admin:${partyId}`, token);
  } catch {}
}

/** 入力の見出し。ホームの行と同じく「アイコンの四角 → 見出しと説明」の形にする */
function FieldHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-accent">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{sub}</span>
      </span>
    </div>
  );
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
  const [view, setView] = useState<"tiles" | "calendar">("tiles");
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
      startTransition(() => {
        addTransitionType("nav-forward");
        router.push(`/p/${result.id}/admin?token=${result.adminToken}&created=1`);
      });
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-5">
          <FieldHead icon={<PenLine className="size-6" aria-hidden />} title="飲み会の名前" sub="みんなに送る画面の見出しになります" />
          <input
            className={`${INPUT} mt-4`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={audience === "student" ? "例: ゼミの打ち上げ" : "例: 部署の歓迎会"}
            maxLength={40}
            aria-label="飲み会の名前"
          />
        </div>

        <div className="border-b border-border px-5 py-5">
          <FieldHead
            icon={<CalendarDays className="size-6" aria-hidden />}
            title="候補の日"
            sub={dates.length > 0 ? `${dates.length}日選んでいます(${MAX_DATES}日まで)` : `行けそうな日を${MAX_DATES}日まで選べます`}
          />
          {/* 近い3週間はタイルで、それより先はカレンダーで選ぶ。選んだ日はどちらにも出る */}
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="group" aria-label="選び方">
            {(["tiles", "calendar"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`min-h-10 rounded-xl text-sm font-bold transition-colors ${
                  view === v ? "bg-surface text-text shadow" : "text-muted hover:text-text"
                }`}
              >
                {v === "tiles" ? "近い日から選ぶ" : "カレンダーで選ぶ"}
              </button>
            ))}
          </div>
          {view === "calendar" && options[0] && (
            <div className="mt-4">
              <DateCalendar today={options[0]} selected={dates} onToggle={toggle} />
            </div>
          )}
          {dates.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              選んだ日: {[...dates].sort().map(dateLabel).join("・")}
            </p>
          )}
          <div className={`mt-4 grid min-h-48 grid-cols-4 gap-2 ${view === "tiles" ? "" : "hidden"}`}>
            {options.map((d) => {
              const on = dates.includes(d);
              const w = weekdayOf(d);
              const [md, wd] = dateLabel(d).split("(");
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(d)}
                  aria-pressed={on}
                  aria-label={dateLabel(d)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border transition-colors ${
                    on ? "border-accent bg-accent text-accent-text" : "border-transparent bg-surface-2 text-text hover:border-muted"
                  }`}
                >
                  <span className="flex items-center gap-0.5 text-sm font-extrabold tabular-nums">
                    {on && <Check className="size-3.5" aria-hidden />}
                    {md}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      on ? "opacity-75" : w === 0 ? "text-danger" : w === 6 ? "text-[#7fb2ff]" : w === 5 ? "text-[#ffd47e]" : "text-muted"
                    }`}
                  >
                    {wd.replace(")", "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-5">
          {error && (
            <p role="alert" className="mb-3 text-sm font-bold text-danger">
              {error}
            </p>
          )}
          <button type="button" onClick={submit} disabled={pending} className={`${BUTTON_PRIMARY} w-full`}>
            {pending ? "作っています…" : "URLを作る"}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            登録はいらず、{AUDIENCES[audience].label}向けの予算と時間でみんなに聞きます
          </p>
        </div>
      </div>
    </>
  );
}
