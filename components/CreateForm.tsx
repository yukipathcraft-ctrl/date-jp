"use client";

import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createParty } from "@/app/actions";
import { AUDIENCES, loadAudience, type Audience } from "@/lib/audience";
import { rememberParty } from "@/lib/myParties";
import { dateLabel, upcomingDates, weekdayOf } from "@/lib/sendai";
import { MAX_DATES } from "@/lib/validation";
import type { Region } from "@/lib/region";
import { DateCalendar } from "./DateCalendar";
import { RegionPicker } from "./RegionPicker";
import { Required } from "./Required";
import { BUTTON_PRIMARY, INPUT } from "./ui";

export function saveAdminToken(partyId: string, token: string) {
  try {
    localStorage.setItem(`nomi:admin:${partyId}`, token);
  } catch {}
}

/** 入力の見出し。もとにした KANJI と同じく、灰色の小さめの字だけにする */
function FieldHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="flex items-center gap-1.5 text-sm font-bold text-white/50">
        {title}
        <Required />
      </p>
      <p className="text-[11px] font-semibold text-white/35">{sub}</p>
    </div>
  );
}

export function CreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience>("student");
  // 飲む地域。仙台(本拠地)なら null
  const [region, setRegion] = useState<Region>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // 今日から24日ぶん(4列のタイルが6段ちょうど埋まる)。日付はブラウザで開いたときに作る
  const [options, setOptions] = useState<string[]>([]);
  const [view, setView] = useState<"tiles" | "calendar">("tiles");
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setOptions(upcomingDates(new Date(), 24));
    setAudience(loadAudience() ?? "student");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle(d: string) {
    setDates((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : cur.length < MAX_DATES ? [...cur, d] : cur));
  }

  function submit() {
    setError(null);
    start(async () => {
      const result = await createParty({ title, audience, dates, region });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      saveAdminToken(result.id, result.adminToken);
      rememberParty({ id: result.id, title: title.trim(), token: result.adminToken, createdAt: Date.now() });
      router.push(`/p/${result.id}/admin?token=${result.adminToken}&created=1`);
    });
  }

  // 押せないときは、何が足りないかをボタンの上に出す(もとにした KANJI と同じ)
  const missing = title.trim() === "" ? "会の名前を入力してください" : dates.length === 0 ? "候補の日を選んでください" : null;

  return (
    <>
      <section className="rounded-3xl bg-surface px-5 py-5 ring-1 ring-white/8">
        <div>
          <FieldHead title="飲み会の名前" sub="みんなに送る画面の見出しになります" />
          <input
            className={`${INPUT} mt-2`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={audience === "student" ? "例: ゼミの打ち上げ" : "例: 部署の歓迎会"}
            maxLength={40}
            aria-label="飲み会の名前"
          />
        </div>

        <div className="mt-5 border-t border-white/8 pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-bold text-white/50">どこで飲む?</p>
            <p className="text-[11px] font-semibold text-white/35">仙台以外も選べます</p>
          </div>
          <div className="mt-3">
            <RegionPicker value={region} onChange={setRegion} />
          </div>
        </div>

        <div className="mt-5 border-t border-white/8 pt-5">
          <FieldHead title="候補の日" sub={dates.length > 0 ? `${dates.length}日選んでいます` : "いくつでも選べます"} />
          {/* 近い24日はタイルで、それより先はカレンダーで選ぶ。選んだ日はどちらにも出る */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-white/6 p-1 ring-1 ring-white/8" role="group" aria-label="選び方">
            {(["tiles", "calendar"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`min-h-10 rounded-xl text-sm font-bold transition-colors ${
                  view === v ? "bg-white/12 text-white" : "text-white/40 hover:text-white/70"
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
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 text-xs text-white/50">選んだ日: {[...dates].sort().map(dateLabel).join("・")}</p>
              <button
                type="button"
                onClick={() => setDates([])}
                className="shrink-0 text-xs font-bold text-white/35 underline underline-offset-2 hover:text-white/55"
              >
                すべて外す
              </button>
            </div>
          )}
          <div className={`mt-3 grid min-h-48 grid-cols-4 gap-1.5 ${view === "tiles" ? "" : "hidden"}`}>
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
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl transition-all duration-150 active:scale-95 ${
                    on ? "bg-accent text-accent-text" : "bg-white/6 text-white ring-1 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-0.5 text-sm font-black tabular-nums">
                    {on && <Check className="size-3.5" aria-hidden />}
                    {md}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      on ? "opacity-75" : w === 0 ? "text-danger" : w === 6 ? "text-[#7fb2ff]" : w === 5 ? "text-[#ffd47e]" : "text-white/40"
                    }`}
                  >
                    {wd.replace(")", "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 決めるボタンは画面の下に固定する(もとにした KANJI と同じ) */}
      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-black via-black/95 to-transparent px-4 pt-4 pb-6">
        {error ? (
          <p role="alert" className="mb-2 text-center text-[11px] font-bold text-danger">
            {error}
          </p>
        ) : (
          <p className="mb-2 text-center text-[11px] text-white/40">
            {missing ?? `登録はいらず、${AUDIENCES[audience].label}向けの予算と時間でみんなに聞きます`}
          </p>
        )}
        <button type="button" onClick={submit} disabled={pending || missing !== null} className={`${BUTTON_PRIMARY} w-full gap-2`}>
          {pending ? "作っています…" : missing ? "名前と候補の日を入れてください" : (
            <>
              URLを作る
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </div>
    </>
  );
}
