"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createParty } from "@/app/actions";
import { AUDIENCES, loadAudience, type Audience } from "@/lib/audience";
import { answeredBefore } from "@/lib/invite";
import { rememberParty } from "@/lib/myParties";
import { clock, dateLabel, upcomingDates } from "@/lib/sendai";
import { MAX_DATES } from "@/lib/validation";
import { DateCalendar } from "./DateCalendar";
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

/** 選べる開始時刻。15:00〜23:45 を15分ごと(分) */
const START_CHOICES = Array.from({ length: 36 }, (_, i) => 900 + i * 15);

export function CreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience>("student");
  // 何時から始めるか(分)。幹事が決め、参加者には聞かない
  const [startAt, setStartAt] = useState(1140);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // 今日。カレンダーで今日より前を選べないようにする。日付はブラウザで開いたときに作る
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setToday(upcomingDates(new Date(), 1)[0]);
    setAudience(loadAudience() ?? "student");
    // 「これまでの会」の「この会をもとに作る」から来たら、名前を入れておく
    const copied = new URLSearchParams(location.search).get("title");
    if (copied) setTitle(copied.slice(0, 40));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle(d: string) {
    setDates((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : cur.length < MAX_DATES ? [...cur, d] : cur));
  }

  function submit() {
    setError(null);
    start(async () => {
      // ほかの会で答えたことがある人なら、招待から幹事になった会として数える
      const result = await createParty({ title, audience, dates, start: startAt, via: answeredBefore() ? "guest" : undefined });
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
          <FieldHead title="飲み会の名前" sub="みんなに送る画面の見出し" />
          <input
            className={`${INPUT} mt-2`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={{ student: "例: ゼミの打ち上げ", private: "例: 高校の同期で飲み", worker: "例: 部署の歓迎会" }[audience]}
            maxLength={40}
            aria-label="飲み会の名前"
          />
        </div>

        <div className="mt-5 border-t border-white/8 pt-5">
          <FieldHead title="何時から始める?" sub="幹事だけで決定" />
          {/* KANJI のように、何時からでも自由に選べるようにする(15分ごと) */}
          <label className="relative mt-3 flex min-h-14 items-center justify-between rounded-2xl bg-white/6 px-4 ring-1 ring-white/10">
            <span className="text-sm font-bold text-white/60">開始時刻</span>
            <span className="flex items-center gap-1.5 text-2xl font-black tabular-nums">
              {clock(startAt)}
              <ChevronDown className="size-5 text-accent" aria-hidden />
            </span>
            <select
              value={startAt}
              onChange={(e) => setStartAt(Number(e.target.value))}
              aria-label="何時から始めるか"
              // 押すと開く時刻の一覧は、スマホによっては白い地に白い字になって読めなくなるので、色をはっきり決めておく
              className="absolute inset-0 cursor-pointer text-white opacity-0 [color-scheme:dark]"
            >
              {START_CHOICES.map((m) => (
                <option key={m} value={m} className="bg-[#1c1a17] text-white">
                  {clock(m)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 border-t border-white/8 pt-5">
          <FieldHead title="候補の日" sub={dates.length > 0 ? `${dates.length}日を選択中` : "いくつでも"} />
          {/* 候補の日はカレンダーで選ぶ */}
          {today && (
            <div className="mt-4">
              <DateCalendar today={today} selected={dates} onToggle={toggle} />
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
            {missing ?? `${AUDIENCES[audience].label}向けの予算と時間で質問`}
          </p>
        )}
        <button type="button" onClick={submit} disabled={pending || missing !== null} className={`${BUTTON_PRIMARY} w-full gap-2`}>
          {pending ? "作成中…" : missing ? "名前と候補の日を入れてください" : (
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
