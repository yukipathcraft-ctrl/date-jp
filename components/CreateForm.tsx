"use client";

import { ArrowRight, Check } from "lucide-react";
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
      <p className="flex items-center gap-1.5 text-sm font-bold text-muted">
        {title}
        <Required />
      </p>
      <p className="text-[11px] font-semibold text-muted">{sub}</p>
    </div>
  );
}

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
          <FieldHead title="何時から始める?" sub="みんなには聞きません" />
          <div className="mt-3 grid grid-cols-3 gap-1.5" role="group" aria-label="何時から始めるか">
            {AUDIENCES[audience].arrivals.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={startAt === m}
                onClick={() => setStartAt(m)}
                className={`flex min-h-12 items-center justify-center gap-1 rounded-xl text-sm font-black tabular-nums transition active:scale-95 ${
                  startAt === m ? "bg-accent text-accent-text" : "bg-white/6 text-white ring-1 ring-white/10 hover:bg-white/10"
                }`}
              >
                {startAt === m && <Check className="size-3.5" aria-hidden />}
                {clock(m)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-white/8 pt-5">
          <FieldHead title="候補の日" sub={dates.length > 0 ? `${dates.length}日選んでいます` : "いくつでも選べます"} />
          {/* 候補の日はカレンダーで選ぶ */}
          {today && (
            <div className="mt-4">
              <DateCalendar today={today} selected={dates} onToggle={toggle} />
            </div>
          )}
          {dates.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 text-xs text-muted">選んだ日: {[...dates].sort().map(dateLabel).join("・")}</p>
              <button
                type="button"
                onClick={() => setDates([])}
                className="shrink-0 text-xs font-bold text-muted underline underline-offset-2 hover:text-muted"
              >
                すべて外す
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 決めるボタンは画面の下に固定する(もとにした KANJI と同じ) */}
      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pt-4 pb-6">
        {error ? (
          <p role="alert" className="mb-2 text-center text-[11px] font-bold text-danger">
            {error}
          </p>
        ) : (
          <p className="mb-2 text-center text-[11px] text-muted">
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
