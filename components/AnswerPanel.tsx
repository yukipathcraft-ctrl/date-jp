"use client";

import { ArrowRight, CalendarDays, Check, Cigarette, Clock, Heart, MapPin, MessageSquareText, Moon, Pencil, UserRound, UtensilsCrossed, Wallet, Wine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getMyAnswer, saveAnswer } from "@/app/actions";
import { AUDIENCES, type Audience } from "@/lib/audience";
import { AVOIDS } from "@/lib/diet";
import { AREAS, GENRES, STAYS, UNLIMITED_BUDGET, clock, dateLabel, inputFromMinutes, minutesFromInput, yen, type AreaKey } from "@/lib/sendai";
import type { DateAnswer } from "@/lib/summary";
import { MAX_AVOID_NOTE, MAX_MEMO, type AnswerInput } from "@/lib/validation";
import { Required } from "./Required";
import { BUTTON_PRIMARY, BUTTON_SUB, INPUT, LABEL, PILL, PILL_OFF, PILL_ON } from "./ui";

type Mine = { answerId: string; token: string; name: string };

const key = (partyId: string) => `nomi:me:${partyId}`;

function loadMine(partyId: string): Mine | null {
  try {
    const raw = localStorage.getItem(key(partyId));
    return raw ? (JSON.parse(raw) as Mine) : null;
  } catch {
    return null;
  }
}

// 色は globals.css の .tier-*。○ は緑、△ は黄、× は赤。色だけでなく記号と文字も添える
const DATE_CHOICES: { value: DateAnswer; mark: string; label: string; tone: "green" | "yellow" | "red" }[] = [
  { value: "ok", mark: "○", label: "行ける", tone: "green" },
  { value: "maybe", mark: "△", label: "たぶん", tone: "yellow" },
  { value: "no", mark: "×", label: "無理", tone: "red" },
];

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`${PILL} px-3 ${on ? PILL_ON : PILL_OFF}`}
    >
      {on && <Check className="size-3.5 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}

/**
 * 時刻を選ぶ。よくある時刻はボタンで、それ以外は「そのほか」から書ける(17:45 や 20:15 など)。
 * value が 0 なら、まだ選んでいない
 */
function TimeChoices({
  presets,
  value,
  onChange,
  overnight,
  hint,
}: {
  presets: { minutes: number; label: string }[];
  value: number;
  onChange: (minutes: number) => void;
  /** 残れる時刻のように夜をまたぐもの。01:00 は 25:00 として扱う */
  overnight: boolean;
  hint: string;
}) {
  const isPreset = presets.some((p) => p.minutes === value);
  const [other, setOther] = useState(false);
  const showInput = other || (value !== 0 && !isPreset);
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Choice
            key={p.minutes}
            on={!showInput && value === p.minutes}
            onClick={() => {
              setOther(false);
              onChange(p.minutes);
            }}
          >
            {p.label}
          </Choice>
        ))}
        <Choice
          on={showInput}
          onClick={() => {
            setOther(true);
            if (isPreset) onChange(0);
          }}
        >
          そのほか
        </Choice>
      </div>
      {showInput && (
        <label className="mt-3 flex items-center gap-3">
          <input
            type="time"
            step={300}
            className={`${INPUT} w-40 [color-scheme:dark]`}
            value={value !== 0 && !isPreset ? inputFromMinutes(value) : ""}
            onChange={(e) => {
              const m = minutesFromInput(e.target.value, overnight);
              if (m !== null) onChange(Math.round(m / 5) * 5);
            }}
            aria-label="時刻を入れる"
          />
          <span className="text-xs text-muted">{hint}</span>
        </label>
      )}
    </>
  );
}

/** start = 幹事が決めた開始時刻(分)。あれば「何時から来られる?」は聞かない(前の会は null) */
/** occasion = 答えたあとに次の幹事に誘うときの、その時期の会の呼び方(忘年会など) */
export function AnswerPanel({
  partyId,
  dates,
  audience,
  start: partyStart,
  occasion,
}: {
  partyId: string;
  dates: string[];
  audience: Audience;
  start: number | null;
  occasion: string;
}) {
  const router = useRouter();
  const [mine, setMine] = useState<Mine | null>(null);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<AnswerInput>({
    name: "",
    dates: Object.fromEntries(dates.map((d) => [d, "ok"])),
    arrival: partyStart ?? 0,
    stay: 0,
    budget: 0,
    areas: [],
    avoids: [],
    drinks: true,
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

  if (!loaded) return <section className="mx-4 min-h-40 rounded-3xl border panel" />;

  if (mine && !editing) {
    return (
      <section className="anim-rise mx-4 rounded-3xl border panel px-4 py-5">
        <p className="flex items-center gap-2 font-black">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-text">
            <Check className="size-4" aria-hidden />
          </span>
          {saved ? `${mine.name}さんの答えを受け取りました、ありがとう!` : `${mine.name}さんの答えは保存してあります`}
        </p>
        <button type="button" onClick={edit} disabled={pending} className={`${BUTTON_SUB} mt-3 w-full gap-2`}>
          <Pencil className="size-4" aria-hidden />
          {pending ? "読み込み中…" : "回答を直す"}
        </button>
        {/* 答えた直後がいちばん目に入るので、ここで次の幹事に誘う */}
        {saved && (
          <Link href="/" className="mt-3 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 text-sm ring-1 ring-white/10 transition-colors hover:bg-white/10">
            <span className="min-w-0 flex-1">
              <span className="font-bold">{occasion}の幹事になったら</span>
              <span className="text-muted">、Dateなら3分で決まります</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-accent" aria-hidden />
          </Link>
        )}
      </section>
    );
  }

  // 続けて押しても前の選択が消えないよう、いつも最新の値から作る
  const set = (patch: Partial<AnswerInput>) => setForm((f) => ({ ...f, ...patch }));
  const setDate = (d: string, v: DateAnswer) => setForm((f) => ({ ...f, dates: { ...f.dates, [d]: v } }));
  const toggleArea = (k: AreaKey) =>
    setForm((f) => ({ ...f, areas: f.areas.includes(k) ? f.areas.filter((a) => a !== k) : [...f.areas, k] }));
  const toggleLike = (k: string) =>
    setForm((f) => {
      const cur = f.likes ?? [];
      return { ...f, likes: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] };
    });
  const toggleAvoid = (k: string) =>
    setForm((f) => {
      const cur = f.avoids ?? [];
      return { ...f, avoids: cur.includes(k) ? cur.filter((a) => a !== k) : [...cur, k] };
    });

  const opts = AUDIENCES[audience];
  // 必須の項目のうち、まだのものをボタンの上に出す(サーバーでも同じ順に確かめる)
  const missing =
    form.name.trim() === ""
      ? "名前を入れてください"
      : partyStart === null && form.arrival === 0
        ? "何時から来られるかを選んでください"
        : form.stay === 0
          ? "いつまで残れるかを選んでください"
          : form.budget === 0
            ? "1人いくらまで出せるかを選んでください"
            : null;
  const areas = opts.areas.map((k) => AREAS.find((a) => a.key === k)!);

  return (
    <section>
      <h2 className="px-4 pb-3 text-lg font-black">{editing ? "回答を直す" : "30秒で答える"}</h2>
      <div className="mx-4 overflow-hidden rounded-3xl border panel">
        <label className="block border-b border-border px-5 py-5">
          <span className={LABEL}>
            <UserRound className="size-4" aria-hidden />
            名前
            <Required />
          </span>
          <input
            className={INPUT}
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="みんなが分かる名前で"
            maxLength={20}
          />
        </label>

        <fieldset className="border-b border-border px-5 py-5">
          <legend className="sr-only">行ける日</legend>
          <p className={LABEL} aria-hidden>
            <CalendarDays className="size-4" />
            行ける日
          </p>
          {/* 日付を上に置き、その下に ○ △ × を横いっぱいに並べる。選んだものは記号ごとの色で塗る */}
          <ul className="space-y-4">
            {dates.map((d) => (
              <li key={d}>
                <p className="mb-2 text-base font-black">{dateLabel(d)}</p>
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={`${dateLabel(d)}に行けるか`}>
                  {DATE_CHOICES.map((c) => {
                    const on = form.dates[d] === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setDate(d, c.value)}
                        className={`tier-${c.tone} flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border text-sm font-bold whitespace-nowrap transition-colors ${
                          on
                            ? "border-[var(--tb)] bg-[var(--tb)] text-black"
                            : "border-white/15 bg-surface-2 text-text hover:border-white/30"
                        }`}
                      >
                        <span aria-hidden className={`text-xl leading-none font-black ${on ? "" : "text-[var(--tc)]"}`}>
                          {c.mark}
                        </span>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </fieldset>

        {partyStart === null && (
        <fieldset className="border-b border-border px-5 py-5">
          <legend className="sr-only">何時から来られる?</legend>
          <p className={LABEL} aria-hidden>
            <Clock className="size-4" />
            何時から来られる?
            <Required />
          </p>
          {/* 来られる時刻は決まった選択肢だけにする(細かい時刻は「ひとこと」に書いてもらう) */}
          <div className="flex flex-wrap gap-2">
            {opts.arrivals.map((m) => (
              <Choice key={m} on={form.arrival === m} onClick={() => set({ arrival: m })}>
                {clock(m)}
              </Choice>
            ))}
          </div>
        </fieldset>
        )}

        <fieldset className="border-b border-border px-5 py-5">
          <legend className="sr-only">いつまで残れる?</legend>
          <p className={LABEL} aria-hidden>
            <Moon className="size-4" />
            いつまで残れる?
            <Required />
          </p>
          <TimeChoices
            presets={STAYS.map((st) => ({ minutes: st.minutes, label: st.label }))}
            value={form.stay}
            onChange={(m) => set({ stay: m })}
            overnight
            hint="夜中の1時なら 01:00 と書けます"
          />
        </fieldset>

        <fieldset className="border-b border-border px-5 py-5">
          <legend className="sr-only">1人いくらまで出せる?</legend>
          <p className={LABEL} aria-hidden>
            <Wallet className="size-4" />
            1人いくらまで出せる?
            <Required />
          </p>
          <div className="flex flex-wrap gap-2">
            {opts.budgets.map((b) => (
              <Choice key={b} on={form.budget === b} onClick={() => set({ budget: b })}>
                〜{yen(b)}
              </Choice>
            ))}
            <Choice on={form.budget === UNLIMITED_BUDGET} onClick={() => set({ budget: UNLIMITED_BUDGET })}>
              上限なし
            </Choice>
          </div>
          <p className="mt-3 text-xs text-muted">誰がいくらと答えたかは幹事にも見えず、行く人全員が出せる額に合わせて決まります</p>
        </fieldset>

        <fieldset className="px-5 py-5">
          <legend className="sr-only">行きやすい場所</legend>
          <p className={LABEL} aria-hidden>
            <MapPin className="size-4" />
            行きやすい場所 <span className="font-normal">(いくつでも)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {/* どこでもいい人は場所を選ばない(場所はほかの人の答えで決まる) */}
            <Choice on={form.areas.length === 0} onClick={() => set({ areas: [] })}>
              どこでもいい
            </Choice>
            {areas.map((a) => (
              <Choice key={a.key} on={form.areas.includes(a.key)} onClick={() => toggleArea(a.key)}>
                {a.label}
              </Choice>
            ))}
          </div>
        </fieldset>

        {/* お酒と、苦手なもの・アレルギー。幹事に言い出しにくいことを、答えと一緒に聞く */}
        <fieldset className="border-t border-border px-5 py-5">
          <legend className="sr-only">お酒と食べもの</legend>
          <p className={LABEL} aria-hidden>
            <Wine className="size-4" />
            お酒は飲む?
          </p>
          <div className="flex flex-wrap gap-2">
            <Choice on={form.drinks !== false} onClick={() => set({ drinks: true })}>
              飲む
            </Choice>
            <Choice on={form.drinks === false} onClick={() => set({ drinks: false })}>
              飲まない
            </Choice>
          </div>
          <p className="mt-2 text-xs text-muted">飲まないと答えると、会計で「飲まない」の区分に入ります</p>

          {/* 社会人の会では、喫煙できるお店かどうかが大事なので聞く(人数だけを幹事に見せる) */}
          {audience === "worker" && (
            <>
              <p className={`${LABEL} mt-5`} aria-hidden>
                <Cigarette className="size-4" />
                タバコは吸う?
              </p>
              <div className="flex flex-wrap gap-2">
                <Choice on={form.smokes === true} onClick={() => set({ smokes: true })}>
                  吸う
                </Choice>
                <Choice on={form.smokes !== true} onClick={() => set({ smokes: false })}>
                  吸わない
                </Choice>
              </div>
              <p className="mt-2 text-xs text-muted">吸う人がいれば、タバコが吸えるお店を先に出します。誰が吸うかは出しません</p>
            </>
          )}

          <p className={`${LABEL} mt-5`} aria-hidden>
            <UtensilsCrossed className="size-4" />
            苦手なもの・アレルギー <span className="font-normal">(なければそのままでOK)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {AVOIDS.map((a) => (
              <Choice key={a.key} on={(form.avoids ?? []).includes(a.key)} onClick={() => toggleAvoid(a.key)}>
                {a.label}
              </Choice>
            ))}
          </div>
          <input
            className={`${INPUT} mt-3 min-h-12 text-sm`}
            value={form.avoidNote ?? ""}
            onChange={(e) => set({ avoidNote: e.target.value.slice(0, MAX_AVOID_NOTE) })}
            placeholder="そのほか(例: パクチー、甲殻類すべて)"
            maxLength={MAX_AVOID_NOTE}
            aria-label="そのほかの苦手なもの"
          />
          <p className="mt-2 text-xs text-muted">誰が選んだか・書いたかは幹事にも見えず、「えび・かにが苦手な人が1人」のように人数と中身だけがお店選びに使われます</p>
        </fieldset>

        {/* 食べたいもの。多いものから、お店を自動でおすすめする */}
        <fieldset className="border-t border-border px-5 py-5">
          <legend className="sr-only">食べたいもの</legend>
          <p className={LABEL} aria-hidden>
            <Heart className="size-4" />
            食べたいもの <span className="font-normal">(いくつでも・なくてもOK)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Choice key={g.key} on={(form.likes ?? []).includes(g.key)} onClick={() => toggleLike(g.key)}>
                {g.label}
              </Choice>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">多かったものから、お店を自動で選びます</p>
        </fieldset>

        <label className="block border-t border-border px-5 py-5">
          <span className={LABEL}>
            <MessageSquareText className="size-4" aria-hidden />
            ひとこと <span className="font-normal">(なくてもOK・みんなに見えます)</span>
          </span>
          <textarea
            className={`${INPUT} min-h-24 resize-none py-3 leading-relaxed`}
            value={form.memo ?? ""}
            onChange={(e) => set({ memo: e.target.value.slice(0, MAX_MEMO) })}
            placeholder="例: 金曜はバイト終わりの19時半から行けます / 2次会は無理そう"
            maxLength={MAX_MEMO}
          />
        </label>
      </div>

      <div className="px-4">
        <p className={`mt-5 flex items-center justify-center gap-1.5 text-xs font-bold ${missing ? "text-white/60" : "text-white/35"}`}>
          {missing ? (
            <>
              <Required />
              {missing}
            </>
          ) : (
            "赤い点の項目はすべて入っています"
          )}
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm font-bold text-danger">
            {error}
          </p>
        )}
        <button type="button" onClick={submit} disabled={pending || missing !== null} className={`${BUTTON_PRIMARY} mt-3 w-full`}>
          {pending ? "保存しています…" : "この内容で答える"}
        </button>
      </div>
    </section>
  );
}
