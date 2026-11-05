"use client";

import { ArrowRight, CalendarDays, Check, Cigarette, Clock, Heart, MapPin, MessageSquareText, Moon, Pencil, UserRound, UtensilsCrossed, Wallet, Wine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getMyAnswer, saveAnswer } from "@/app/actions";
import { AUDIENCES, isAdult, type Audience } from "@/lib/audience";
import { AVOIDS } from "@/lib/diet";
import { ANSWER_BUDGETS, GENRES, STAY_CHOICES, UNLIMITED_BUDGET, clock, dateLabel, stayLabel, yen } from "@/lib/sendai";
import { AddPicker } from "./AddPicker";
import { Picker } from "./Picker";
import { StationPicker } from "./StationPicker";
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

/** start = 幹事が決めた開始時刻(分)。あれば「何時から来られる?」は聞かない(前の会は null) */
/** occasion = 答えたあとに次の幹事に誘うときの、その時期の会の呼び方(忘年会など) */
/**
 * host = 幹事の画面に置くとき。まだ答えていなければ、大きな入力欄の代わりに「自分の予定を入れる」ボタンを出し、押すとその場で開く。
 * hostOpen = 最初から開いておく(会を作った直後)
 */
export function AnswerPanel({
  partyId,
  dates,
  audience,
  start: partyStart,
  occasion,
  host = false,
  hostOpen = false,
}: {
  partyId: string;
  dates: string[];
  audience: Audience;
  start: number | null;
  occasion: string;
  host?: boolean;
  hostOpen?: boolean;
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
  /** 「今回はパス」で答えたか(受け取りの文を変える) */
  const [passed, setPassed] = useState(false);
  /** 幹事の画面で、入力欄を開いたか */
  const [open, setOpen] = useState(hostOpen);
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

  function submit(input: AnswerInput = form, pass = false) {
    setError(null);
    start(async () => {
      const result = await saveAnswer(partyId, mine ? { answerId: mine.answerId, token: mine.token } : null, input);
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
      setPassed(pass);
      router.refresh();
    });
  }

  if (!loaded) return host ? null : <section className="mx-4 min-h-40 rounded-3xl border panel" />;

  if (host && !mine && !editing && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-4 flex w-[calc(100%-2rem)] items-center gap-2 rounded-3xl border panel px-4 py-4 text-left text-sm font-bold transition-colors hover:bg-white/5"
      >
        <UserRound className="size-4 shrink-0 text-accent" aria-hidden />
        <span className="flex-1">自分の予定を入れる</span>
        <ArrowRight className="size-4 shrink-0 text-accent" aria-hidden />
      </button>
    );
  }

  if (mine && !editing) {
    return (
      <section className="anim-rise mx-4 rounded-3xl border panel px-4 py-5">
        <p className="flex items-center gap-2 font-black">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-text">
            <Check className="size-4" aria-hidden />
          </span>
          {saved
            ? passed
              ? `${mine.name}さん、今回は行けないと受け取りました。また誘いますね`
              : `${mine.name}さんの答えを受け取りました、ありがとう!`
            : `${mine.name}さんの答え、保存済み`}
        </p>
        <button type="button" onClick={edit} disabled={pending} className={`${BUTTON_SUB} mt-3 w-full gap-2`}>
          <Pencil className="size-4" aria-hidden />
          {pending ? "読み込み中…" : "回答を直す"}
        </button>
        {/* 答えた直後がいちばん目に入るので、ここで次の幹事に誘う */}
        {saved && !passed && !host && (
          <Link href="/" className="mt-3 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 text-sm ring-1 ring-white/10 transition-colors hover:bg-white/10">
            <span className="min-w-0 flex-1">
              <span className="font-bold">{occasion}の幹事になったら</span>
              <span className="text-muted">、Dateなら3分で決定</span>
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
            ? "どのくらいのお店がいいかを選んでください"
            : null;

  return (
    <section>
      <h2 className="px-4 pb-3 text-lg font-black">{editing ? "回答を直す" : host ? "自分の予定を入れる" : "30秒で答える"}</h2>
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
          {/*
            行かない人が気まずくならないよう、理由を聞かずに1回で断れるようにする。
            全部の日を × にして送るので、催促や「まだの人」には出ない。予算や時刻は使われない値を入れておく
          */}
          {!editing && !host && (
            <button
              type="button"
              disabled={pending || form.name.trim() === ""}
              onClick={() =>
                submit(
                  {
                    name: form.name,
                    dates: Object.fromEntries(dates.map((d) => [d, "no"])),
                    arrival: partyStart ?? 1080,
                    stay: 1440,
                    budget: UNLIMITED_BUDGET,
                    areas: [],
                  },
                  true,
                )
              }
              className="mt-3 min-h-11 w-full rounded-xl text-sm text-muted underline-offset-4 transition-colors enabled:hover:text-text enabled:hover:underline disabled:opacity-60"
            >
              {form.name.trim() === ""
                ? "今回は行けないときは、名前を入れてここを押してください"
                : "今回は行けないときはこちら(理由は聞きません)"}
            </button>
          )}
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
          {/* 幹事の開始時刻と同じように、30分ごとの細かい時刻から選ぶ */}
          <Picker
            label="残れる時刻"
            value={form.stay}
            options={STAY_CHOICES.map((m) => ({ value: m, label: stayLabel(m) }))}
            onChange={(m) => set({ stay: m })}
          />
        </fieldset>

        <fieldset className="border-b border-border px-5 py-5">
          <legend className="sr-only">どのくらいのお店がいい?</legend>
          <p className={LABEL} aria-hidden>
            <Wallet className="size-4" />
            どのくらいのお店がいい?
            <Required />
          </p>
          {/* 500円ごとの細かい額から選ぶ(上限なしも選べる) */}
          <Picker
            label="1人の目安"
            value={form.budget}
            options={[...ANSWER_BUDGETS.map((b) => ({ value: b, label: `${yen(b)}くらいまで` })), { value: UNLIMITED_BUDGET, label: "どこでもいい" }]}
            onChange={(b) => set({ budget: b })}
          />
          <p className="mt-3 text-xs text-muted">誰が選んだかは幹事にも非公開</p>
        </fieldset>

        <fieldset className="px-5 py-5">
          <legend className="sr-only">行きやすい場所</legend>
          <p className={LABEL} aria-hidden>
            <MapPin className="size-4" />
            行きやすい駅
          </p>
          {/* 駅は全国から選べる。みんなの駅から、集まりやすい駅の近くでお店を探す */}
          <StationPicker value={form.station ?? null} onChange={(station) => set({ station, areas: [] })} />
          <p className="mt-3 text-xs text-muted">みんなの駅から集まりやすい駅を自動で決定</p>
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
          <p className="mt-2 text-xs text-muted">「飲まない」なら、会計で「飲まない」の区分に</p>

          {/* 社会人の会(プライベート・会社)では、喫煙できるお店かどうかが大事なので聞く(人数だけを幹事に見せる) */}
          {isAdult(audience) && (
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
              <p className="mt-2 text-xs text-muted">吸える店を優先・誰が吸うかは非公開</p>
            </>
          )}

          <p className={`${LABEL} mt-5`} aria-hidden>
            <UtensilsCrossed className="size-4" />
            苦手なもの・アレルギー <span className="font-normal">(なければそのままでOK)</span>
          </p>
          {/* 選択肢が多いので、▼ で選んで足していく。選んだものだけを下に並べ、× で外す。誰が選んだかは出さない */}
          <AddPicker
            label="苦手なもの・アレルギー"
            groups={[
              { group: "アレルギー", options: AVOIDS.filter((x) => x.kind === "allergy") },
              { group: "苦手なもの", options: AVOIDS.filter((x) => x.kind === "dislike") },
            ]}
            selected={form.avoids ?? []}
            onToggle={toggleAvoid}
            tone="red"
          />
          <input
            className={`${INPUT} mt-3 min-h-12 text-sm`}
            value={form.avoidNote ?? ""}
            onChange={(e) => set({ avoidNote: e.target.value.slice(0, MAX_AVOID_NOTE) })}
            placeholder="そのほか(例: パクチー、甲殻類すべて)"
            maxLength={MAX_AVOID_NOTE}
            aria-label="そのほかの苦手なもの"
          />
          <p className="mt-2 text-xs text-muted">誰が選んだかは幹事にも非公開</p>
        </fieldset>

        {/* 食べたいもの。多いものから、お店を自動でおすすめする */}
        <fieldset className="border-t border-border px-5 py-5">
          <legend className="sr-only">食べたいもの</legend>
          <p className={LABEL} aria-hidden>
            <Heart className="size-4" />
            食べたいもの <span className="font-normal">(いくつでも・なくてもOK)</span>
          </p>
          {/* アレルギーと同じく、▼ で選んで足していく */}
          <AddPicker label="食べたいもの" groups={[{ options: GENRES }]} selected={form.likes ?? []} onToggle={toggleLike} tone="green" />
          <p className="mt-2 text-xs text-muted">多かったものからお店を自動で選定</p>
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
            "赤い点の項目はすべて入力済み"
          )}
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm font-bold text-danger">
            {error}
          </p>
        )}
        <button type="button" onClick={() => submit()} disabled={pending || missing !== null} className={`${BUTTON_PRIMARY} mt-3 w-full`}>
          {pending ? "保存しています…" : "この内容で答える"}
        </button>
      </div>
    </section>
  );
}
