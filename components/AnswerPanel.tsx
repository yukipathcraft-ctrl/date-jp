"use client";

import { Check, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getMyAnswer, saveAnswer } from "@/app/actions";
import { ARRIVALS, AREAS, BUDGETS, STAYS, clock, dateLabel, yen, type AreaKey } from "@/lib/sendai";
import type { DateAnswer } from "@/lib/summary";
import type { AnswerInput } from "@/lib/validation";
import { BUTTON_PRIMARY, BUTTON_SUB, INPUT } from "./ui";

type Mine = { answerId: string; token: string; name: string };

const key = (partyId: string) => `nomise:me:${partyId}`;

function loadMine(partyId: string): Mine | null {
  try {
    const raw = localStorage.getItem(key(partyId));
    return raw ? (JSON.parse(raw) as Mine) : null;
  } catch {
    return null;
  }
}

const DATE_CHOICES: { value: DateAnswer; mark: string; label: string }[] = [
  { value: "ok", mark: "○", label: "行ける" },
  { value: "maybe", mark: "△", label: "たぶん" },
  { value: "no", mark: "×", label: "無理" },
];

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex min-h-11 items-center justify-center gap-1 rounded-xl border px-2 text-sm font-bold transition-colors ${
        on ? "border-accent bg-accent text-accent-text" : "border-border bg-surface"
      }`}
    >
      {on && <Check className="size-3.5 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}

export function AnswerPanel({ partyId, dates }: { partyId: string; dates: string[] }) {
  const router = useRouter();
  const [mine, setMine] = useState<Mine | null>(null);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<AnswerInput>({
    name: "",
    dates: Object.fromEntries(dates.map((d) => [d, "no"])),
    arrival: 0,
    stay: 0,
    budget: 0,
    areas: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    // localStorage はブラウザでしか読めないので、描画のあとで読む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(loadMine(partyId));
    setLoaded(true);
  }, [partyId]);

  function edit() {
    if (!mine) return;
    start(async () => {
      const prev = await getMyAnswer(partyId, mine.answerId, mine.token);
      if (prev) setForm({ ...prev, dates: { ...Object.fromEntries(dates.map((d) => [d, "no"])), ...prev.dates } });
      setEditing(true);
    });
  }

  function submit() {
    setError(null);
    start(async () => {
      const result = await saveAnswer(partyId, mine ? { answerId: mine.answerId, token: mine.token } : null, form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = { answerId: result.answerId, token: result.token, name: form.name.trim() };
      try {
        localStorage.setItem(key(partyId), JSON.stringify(next));
      } catch {}
      setMine(next);
      setEditing(false);
      setSaved(true);
      router.refresh();
    });
  }

  if (!loaded) return <section className="min-h-40 border-y border-border bg-surface" />;

  if (mine && !editing) {
    return (
      <section className="anim-rise border-y border-border bg-surface px-4 py-5">
        <p className="flex items-center gap-2 font-extrabold">
          <span className="grid size-6 place-items-center rounded-full bg-ok text-white">
            <Check className="size-4" aria-hidden />
          </span>
          {mine.name}さんの回答は保存済み{saved && "です。ありがとう!"}
        </p>
        <button type="button" onClick={edit} disabled={pending} className={`${BUTTON_SUB} mt-3 w-full gap-2`}>
          <Pencil className="size-4" aria-hidden />
          {pending ? "読み込み中…" : "回答を直す"}
        </button>
      </section>
    );
  }

  // 続けて押しても前の選択が消えないよう、いつも最新の値から作る
  const set = (patch: Partial<AnswerInput>) => setForm((f) => ({ ...f, ...patch }));
  const setDate = (d: string, v: DateAnswer) => setForm((f) => ({ ...f, dates: { ...f.dates, [d]: v } }));
  const toggleArea = (k: AreaKey) =>
    setForm((f) => ({ ...f, areas: f.areas.includes(k) ? f.areas.filter((a) => a !== k) : [...f.areas, k] }));

  return (
    <section className="border-y border-border bg-surface px-4 py-6">
      <h2 className="text-lg font-extrabold">{editing ? "回答を直す" : "30秒で答える"}</h2>
      <div className="mt-5 space-y-6">
        <label className="block">
          <span className="mb-2 block text-sm font-bold">名前</span>
          <input
            className={INPUT}
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="みんなが分かる名前"
            maxLength={20}
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">行ける日</legend>
          <ul className="space-y-2">
            {dates.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <span className="w-20 shrink-0 font-bold">{dateLabel(d)}</span>
                <div className="grid flex-1 grid-cols-3 gap-1.5">
                  {DATE_CHOICES.map((c) => (
                    <Choice key={c.value} on={form.dates[d] === c.value} onClick={() => setDate(d, c.value)}>
                      {c.mark} {c.label}
                    </Choice>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">何時から来られる?</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {ARRIVALS.map((m) => (
              <Choice key={m} on={form.arrival === m} onClick={() => set({ arrival: m })}>
                {clock(m)}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">いつまで残れる?</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {STAYS.map((s) => (
              <Choice key={s.minutes} on={form.stay === s.minutes} onClick={() => set({ stay: s.minutes })}>
                {s.label}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-bold">1人いくらまで出せる?</legend>
          <p className="mb-2 text-xs text-muted">誰がいくらと答えたかは、幹事にも出ません。行く人全員が出せる額に合わせます。</p>
          <div className="grid grid-cols-3 gap-1.5">
            {BUDGETS.map((b) => (
              <Choice key={b} on={form.budget === b} onClick={() => set({ budget: b })}>
                〜{yen(b)}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">
            行きやすい場所 <span className="font-normal text-muted">(いくつでも)</span>
          </legend>
          <div className="grid grid-cols-2 gap-1.5">
            {AREAS.map((a) => (
              <Choice key={a.key} on={form.areas.includes(a.key)} onClick={() => toggleArea(a.key)}>
                <span className="flex flex-col leading-tight">
                  <span>{a.label}</span>
                  <span className="text-[11px] font-normal opacity-75">{a.note}</span>
                </span>
              </Choice>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm font-bold text-danger">
            {error}
          </p>
        )}
        <button type="button" onClick={submit} disabled={pending} className={`${BUTTON_PRIMARY} w-full`}>
          {pending ? "保存しています…" : "この内容で答える"}
        </button>
      </div>
    </section>
  );
}
