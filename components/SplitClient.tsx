"use client";

import { Check, Crown, ExternalLink, NotebookPen, PencilLine, Plus, RotateCcw, Users, Wallet, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { partyAttendees, partyStatuses, startCollection } from "@/app/actions";
import { loadAudience, type Audience } from "@/lib/audience";
import { loadMyParties, type MyParty } from "@/lib/myParties";
import { dateLabel, yen } from "@/lib/sendai";
import { NextHost } from "./NextHost";
import { SendButtons, useCanShare } from "./SendButtons";
import { ROUND_UNITS, WEIGHTS, splitBill, tenthsFromInput, type Weight } from "@/lib/split";
import { BUTTON_PRIMARY, BUTTON_SUB, PILL, PILL_OFF, PILL_ON } from "./ui";

// 会計。最初は傾斜(区分や倍率を選ぶ)で、「割り勘」に切り替えると全員同じ額にする。
// 傾斜では hasuru と同じく、区分ごとに色・記号・頭文字の丸で人を見分ける(色だけに頼らない)

/** weight は区分の key。自分で倍率を書いたときは "custom" にして、書いた文字を custom に持つ */
type Person = { id: number; name: string; weight: string; custom: string };

/** 幹事の画面から「この会の会計」で来たとき、行く人の名前とお酒を飲まないかを受け取る(URL には載せない) */
export const SPLIT_NAMES_KEY = "nomi:split-names";

/** 集金が終わるまで続きから使えるよう、最後の会計をこの端末に残す(サーバーには送らない) */
const SAVE_KEY = "nomi:split";
/** collection は作った集金のページ(幹事の鍵つき)。作ったあとに金額を変えたら作り直す */
type Saved = {
  title: string;
  total: string;
  people: Person[];
  unit: number;
  organizer: number;
  /** 傾斜で割るか。前の保存にないときは傾斜にする */
  weighted?: boolean;
  collection?: { id: string; token: string } | null;
};

function loadSaved(): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null") as Saved | null;
    return v && Array.isArray(v.people) && v.people.length > 0 ? v : null;
  } catch {
    return null;
  }
}

let nextId = 1;
const person = (weight: string, name = ""): Person => ({ id: nextId++, name, weight, custom: "" });
const startPeople = () => [person("normal", "幹事"), person("normal"), person("normal"), person("normal")];

function Avatar({ name, tone, size = "md" }: { name: string; tone: Weight["tone"]; size?: "sm" | "md" }) {
  const initial = [...name.trim()][0] ?? "?";
  return (
    <span
      aria-hidden
      className={`tier-${tone} grid shrink-0 place-items-center rounded-full bg-[var(--ts)] font-black text-[var(--tc)] ring-1 ring-[var(--tb)]/40 ${
        size === "md" ? "size-11 text-base" : "size-8 text-xs"
      }`}
    >
      {initial}
    </span>
  );
}

function TierTag({ w }: { w: Weight }) {
  return (
    <span
      className={`tier-${w.tone} inline-flex shrink-0 items-center gap-0.5 rounded-md bg-[var(--ts)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--tc)]`}
    >
      <span aria-hidden>{w.mark}</span>
      {w.label}
    </span>
  );
}

export function SplitClient() {
  const [audience, setAudience] = useState<Audience>("student");
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [unit, setUnit] = useState<number>(100);
  const [organizer, setOrganizer] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [collection, setCollection] = useState<Saved["collection"]>(null);
  const [weighted, setWeighted] = useState(true);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [collecting, startCollecting] = useTransition();
  const router = useRouter();
  const canShare = useCanShare();
  // この端末で作った、決まった会。押すと行く人の名前をそのまま読み込む
  const [decidedParties, setDecidedParties] = useState<{ party: MyParty; date: string }[]>([]);
  const [importing, startImporting] = useTransition();

  useEffect(() => {
    const mine = loadMyParties();
    if (mine.length === 0) return;
    partyStatuses(mine.map((p) => p.id))
      .then((st) =>
        setDecidedParties(
          mine
            .filter((p) => st[p.id]?.decision)
            .map((p) => ({ party: p, date: st[p.id].decision!.date }))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5),
        ),
      )
      .catch(() => {});
  }, []);

  function importParty(p: MyParty) {
    if (people.some((x) => x.name.trim()) && !window.confirm(`いまの名前を消して、「${p.title}」の行く人を読み込みますか?`)) return;
    startImporting(async () => {
      const r = await partyAttendees(p.id, p.token);
      if (!r || r.attendees.length === 0) {
        window.alert("この会の行く人を読み込めませんでした");
        return;
      }
      setTitle(`${r.title} ${dateLabel(r.date).split("(")[0]}`.slice(0, 30));
      setPeople(r.attendees.slice(0, 30).map((a) => person(a.soft ? "soft" : "normal", a.name.slice(0, 20))));
      setOrganizer(0);
      setCollection(null);
    });
  }

  useEffect(() => {
    const a = loadAudience() ?? "student";
    // 前の形(名前だけの文字列)でも受け取れるようにする
    let names: (string | { name: string; soft?: boolean })[] = [];
    try {
      names = JSON.parse(sessionStorage.getItem(SPLIT_NAMES_KEY) ?? "[]");
      // 受け取ったら消す。開発中は準備が2回走るので、すぐには消さず、2回とも同じ名前を読めるようにする
      setTimeout(() => {
        try {
          sessionStorage.removeItem(SPLIT_NAMES_KEY);
        } catch {}
      }, 0);
    } catch {}
    const saved = names.length > 0 ? null : loadSaved();
    /* eslint-disable react-hooks/set-state-in-effect */
    setAudience(a);
    if (saved) {
      // 前の会計の続き。足す人の番号が重ならないようにする
      nextId = Math.max(...saved.people.map((p) => p.id)) + 1;
      setTitle(saved.title ?? "");
      setTotal(saved.total ?? "");
      setPeople(saved.people.map((p) => ({ id: p.id, name: p.name, weight: p.weight, custom: p.custom ?? "" })));
      setCollection(saved.collection ?? null);
      setWeighted(saved.weighted ?? true);
      setUnit(saved.unit ?? 100);
      setOrganizer(saved.organizer ?? 0);
    } else {
      setPeople(names.length > 0 ? names.slice(0, 30).map((n) =>
              typeof n === "string"
                ? person("normal", n.slice(0, 20))
                : person(n.soft ? "soft" : "normal", String(n.name).slice(0, 20)),
            ) : startPeople());
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 変えるたびにこの端末に残す(読み込みが済むまでは上書きしない)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ title, total, people, unit, organizer, weighted, collection } satisfies Saved));
    } catch {}
  }, [loaded, title, total, people, unit, organizer, weighted, collection]);

  function startOver() {
    if (!window.confirm("いまの会計を消して、新しい会計を始めますか?")) return;
    setTitle("");
    setTotal("");
    setPeople(startPeople());
    setUnit(100);
    setOrganizer(0);
    setWeighted(true);
    setCollection(null);
  }

  const weights = WEIGHTS[audience];
  const normal = weights.find((w) => w.key === "normal")!;
  /** 割り勘のとき。全員同じ倍率で、区分の印は出さない */
  const even: Weight = { key: "even", label: "", note: "", tenths: 10, mark: "", tone: "yellow" };
  const weightOf = (p: Person): Weight => {
    if (!weighted) return even;
    if (p.weight !== "custom") return weights.find((w) => w.key === p.weight) ?? normal;
    // 書きかけで読めないうちは「ふつう」と同じ倍率で数える
    const tenths = tenthsFromInput(p.custom) ?? normal.tenths;
    return { key: "custom", label: `×${(tenths / 10).toFixed(1)}`, note: "", tenths, mark: "✎", tone: "gray" };
  };
  const totalYen = Number(total);
  const ready = Number.isInteger(totalYen) && totalYen > 0 && people.length > 0;
  const result = ready
    ? splitBill({ total: totalYen, weights: people.map((p) => weightOf(p).tenths), unit, organizer })
    : null;
  const nameOf = (p: Person, i: number) => p.name.trim() || `${i + 1}人目`;

  function update(id: number, patch: Partial<Person>) {
    setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function remove(i: number) {
    setPeople((ps) => ps.filter((_, j) => j !== i));
    setOrganizer((o) => (o === i ? 0 : o > i ? o - 1 : o));
  }

  const shareText = result
    ? [
        `${title.trim() ? `「${title.trim()}」の` : ""}お会計 ${yen(totalYen)}(${people.length}人)`,
        ...people.map((p, i) => `${weighted ? `${weightOf(p).mark} ` : "・"}${nameOf(p, i)} ${yen(result.amounts[i])}`),
      ].join("\n")
    : "";

  /** 集金のページを作る。金額はサーバーで計算し直し、幹事の画面へ移る */
  function makeCollection() {
    setCollectError(null);
    startCollecting(async () => {
      const r = await startCollection({
        title,
        audience,
        total: totalYen,
        unit,
        organizer,
        people: people.map((p, i) => {
          const w = weightOf(p);
          return { name: nameOf(p, i), tenths: w.tenths, label: w.label, mark: w.mark, tone: w.tone };
        }),
      });
      if (!r.ok) {
        setCollectError(r.error);
        return;
      }
      setCollection({ id: r.id, token: r.adminToken });
      router.push(`/c/${r.id}?token=${r.adminToken}`);
    });
  }

  return (
    <>
      {/* 決まった会があれば、行く人の名前とお酒を飲まない人をそのまま読み込める */}
      {decidedParties.length > 0 && (
        <section className="mx-4 mb-3">
          <p className="mb-2 px-1 text-[10px] font-black tracking-[0.2em] text-muted">決まった会から名前を読み込む</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {decidedParties.map(({ party: p, date }) => (
              <button
                key={p.id}
                type="button"
                disabled={importing}
                onClick={() => importParty(p)}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-surface px-3.5 py-2 text-left ring-1 ring-border-strong transition hover:bg-surface-2 active:scale-95 disabled:opacity-50"
              >
                <Users className="size-4 shrink-0 text-accent" aria-hidden />
                <span>
                  <span className="block max-w-[10rem] truncate text-[13px] font-black">{p.title}</span>
                  <span className="block text-[10px] text-muted">{dateLabel(date)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 何の会計かのメモ。催促の文にも入る */}
      <label className="mx-4 mb-3 flex items-center gap-3 rounded-3xl border panel px-5 py-3">
        <NotebookPen className="size-5 shrink-0 text-accent" aria-hidden />
        <input
          className="min-h-11 w-full min-w-0 bg-transparent font-bold outline-none placeholder:font-normal placeholder:text-muted"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 30))}
          placeholder="何の会計?(例: ゼミの打ち上げ 10/30)"
          aria-label="何の会計かのメモ"
        />
      </label>

      {/* 合計 */}
      <label className="mx-4 block rounded-3xl border panel px-5 py-5">
        <span className="text-sm font-bold text-muted">お会計の合計</span>
        <span className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-muted">¥</span>
          <input
            className="w-full min-w-0 bg-transparent text-4xl font-black tracking-tight tabular-nums outline-none placeholder:text-border"
            inputMode="numeric"
            value={total === "" ? "" : Number(total).toLocaleString("ja-JP")}
            onChange={(e) => setTotal(e.target.value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 7))}
            placeholder="0"
            aria-label="お会計の合計(円)"
          />
        </span>
      </label>

      {/* 傾斜で割るか(左・最初の選択)、全員同じ額の割り勘か(右) */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="group" aria-label="割り方">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={weighted === v}
            onClick={() => setWeighted(v)}
            className={`min-h-11 rounded-xl text-sm font-bold transition-colors ${
              weighted === v ? "bg-surface text-text shadow" : "text-muted hover:text-text"
            }`}
          >
            {v ? "傾斜で割る" : "割り勘"}
          </button>
        ))}
      </div>

      {/* 区分の見本 */}
      {weighted && (
      <div className="anim-rise mx-4 mt-3 flex flex-wrap gap-1.5" aria-label="傾斜の区分">
        {weights.map((w) => (
          <span key={w.key} className={`tier-${w.tone} inline-flex items-center gap-1 rounded-full bg-[var(--ts)] px-2.5 py-1 text-xs font-bold text-[var(--tc)]`}>
            <span aria-hidden>{w.mark}</span>
            {w.label} ×{(w.tenths / 10).toFixed(1)}
          </span>
        ))}
      </div>
      )}

      {/* 払う人 */}
      <ul className="mx-4 mt-3 space-y-2">
        {people.map((p, i) => {
          const w = weightOf(p);
          const customOn = p.weight === "custom";
          const customBad = customOn && p.custom.trim() !== "" && tenthsFromInput(p.custom) === null;
          return (
            <li key={p.id} className={`tier-${w.tone} rounded-3xl border border-[var(--tb)]/30 bg-surface p-3`}>
              <div className="flex items-center gap-2.5">
                <Avatar name={nameOf(p, i)} tone={w.tone} />
                <input
                  className="min-h-11 w-full min-w-0 rounded-xl bg-surface-2 px-3 font-bold outline-none placeholder:font-normal placeholder:text-muted focus:ring-1 focus:ring-[var(--tb)]"
                  value={p.name}
                  onChange={(e) => update(p.id, { name: e.target.value.slice(0, 20) })}
                  placeholder={`${i + 1}人目の名前`}
                  aria-label={`${i + 1}人目の名前`}
                />
                <button
                  type="button"
                  onClick={() => setOrganizer(i)}
                  aria-pressed={organizer === i}
                  aria-label={`${nameOf(p, i)}を幹事にする(端数を受け持つ)`}
                  className={`grid size-11 shrink-0 place-items-center rounded-full ${
                    organizer === i ? "bg-accent text-accent-text" : "text-muted hover:text-text"
                  }`}
                >
                  <Crown className="size-5" aria-hidden />
                </button>
                {people.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={`${nameOf(p, i)}を外す`}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:text-text"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                )}
              </div>
              {weighted && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {weights.map((opt) => {
                  const on = p.weight === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => update(p.id, { weight: opt.key })}
                      className={`tier-${opt.tone} inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-xs font-bold transition-colors ${
                        on
                          ? "border-[var(--tb)] bg-[var(--ts)] text-[var(--tc)]"
                          : "border-border text-muted hover:text-text"
                      }`}
                    >
                      <span aria-hidden>{on ? <Check className="size-3" /> : opt.mark}</span>
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={customOn}
                  onClick={() => update(p.id, { weight: "custom" })}
                  className={`tier-gray inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-xs font-bold transition-colors ${
                    customOn ? "border-[var(--tb)] bg-[var(--ts)] text-[var(--tc)]" : "border-border text-muted hover:text-text"
                  }`}
                >
                  <span aria-hidden>{customOn ? <Check className="size-3" /> : <PencilLine className="size-3" />}</span>
                  倍率を入れる
                </button>
              </div>
              )}
              {weighted && customOn && (
                <label className="mt-2.5 flex items-center gap-2">
                  <span className="text-lg font-black text-[var(--tc)]" aria-hidden>
                    ×
                  </span>
                  <input
                    className="min-h-11 w-24 rounded-xl bg-surface-2 px-3 text-lg font-black tabular-nums outline-none placeholder:font-normal placeholder:text-muted focus:ring-1 focus:ring-[var(--tb)]"
                    inputMode="decimal"
                    value={p.custom}
                    onChange={(e) => update(p.id, { custom: e.target.value.slice(0, 4) })}
                    placeholder="1.2"
                    aria-label={`${nameOf(p, i)}の倍率`}
                    autoFocus
                  />
                  <span className={`text-xs ${customBad ? "font-bold text-danger" : "text-muted"}`}>
                    {customBad ? "0.1〜5.0 の数で書いてください" : "ふつうの人を 1.0 として、0.1〜5.0 で書けます"}
                  </span>
                </label>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mx-4 mt-2 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={() => setPeople((ps) => [...ps, person("normal")])}
          disabled={people.length >= 30}
          className={`${BUTTON_SUB} gap-2 whitespace-nowrap px-3`}
        >
          <Plus className="size-4" aria-hidden />
          人を足す
        </button>
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-surface-2 px-1.5" role="group" aria-label="何円単位にそろえるか">
          {ROUND_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
              className={`${PILL} min-h-9 px-2.5 text-xs ${unit === u ? PILL_ON : `${PILL_OFF} border-transparent bg-transparent`}`}
            >
              {u}円
            </button>
          ))}
        </div>
      </div>

      {/* 結果 */}
      <section className="glow mx-4 mt-5 overflow-hidden rounded-3xl border border-accent/40 bg-surface" aria-live="polite">
        <div className="flex items-baseline justify-between px-5 pt-5">
          <h2 className="text-lg font-black">1人いくら?</h2>
          {result && <span className="text-xs font-bold text-muted">{unit}円単位でそろえています</span>}
        </div>
        {result ? (
          <>
            {/* 誰がどれだけ持つかを、区分の色の帯で見せる */}
            <div className="mx-5 mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden>
              {people.map((p, i) => (
                <span
                  key={p.id}
                  className={`tier-${weightOf(p).tone} h-full bg-[var(--tb)] [&:not(:first-child)]:border-l-2 [&:not(:first-child)]:border-surface`}
                  style={{ width: `${(result.amounts[i] / totalYen) * 100}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 divide-y divide-border">
              {people.map((p, i) => {
                const w = weightOf(p);
                return (
                  <li key={p.id} className="flex min-h-14 items-center gap-2.5 px-4">
                    <Avatar name={nameOf(p, i)} tone={w.tone} size="sm" />
                    {/* 名前を1行目、区分と幹事の印を2行目に置き、スマホの幅でも名前が切れにくいようにする */}
                    <span className="min-w-0 flex-1 py-2">
                      <span className="block truncate font-bold">{nameOf(p, i)}</span>
                      <span className="mt-1 flex items-center gap-1">
                        {weighted && <TierTag w={w} />}
                        {organizer === i && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-accent-text">
                            <Crown className="size-3" aria-hidden />
                            幹事
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-lg font-black tabular-nums">{yen(result.amounts[i])}</span>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-baseline justify-between border-t-2 border-text/80 px-5 py-3">
              <span className="text-sm font-bold">合計</span>
              <span className="flex items-center gap-2">
                <span className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[#1f7a4a] ring-1 ring-[#1f7a4a]/50">✓ 一致</span>
                <span className="text-lg font-black tabular-nums">{yen(totalYen)}</span>
              </span>
            </div>
            <p className="px-5 text-xs text-muted">
              {result.organizerDiff === 0
                ? "端数は出ませんでした"
                : `端数の${yen(Math.abs(result.organizerDiff))}ぶん、幹事が${result.organizerDiff > 0 ? "多め" : "少なめ"}に払います`}
            </p>
            <div className="px-5 pb-5">
              <SendButtons
                mainLabel="共有して金額を送る"
                line={shareText}
                share={{ text: shareText }}
                copy={shareText}
                copyLabel="金額をコピー"
                canShare={canShare}
                audience={audience}
              />
            </div>
          </>
        ) : (
          <p className="px-5 pt-2 pb-5 text-sm text-muted">合計を入れると、一人ずつの金額が出ます</p>
        )}
      </section>

      {/* 集金。払った人が自分で「払った」を押せるページを作り、幹事はそこで受け取りの記録と催促をする */}
      {/* トップの「集金のチェック」からはここへ来る(#collect) */}
      <section id="collect" className="mx-4 mt-4 scroll-mt-20 rounded-3xl border panel px-5 py-5">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Wallet className="size-5" aria-hidden />
            集金のチェック
          </h2>
          <p className="mt-1 text-sm text-muted">
            集金のページを作ってみんなに送ると、払った人が自分で「払った」を押せます。誰が払ったかは幹事の画面でまとめて見られ、まだの人にだけ催促を送れます
          </p>
          {collectError && (
            <p role="alert" className="mt-3 text-sm font-bold text-danger">
              {collectError}
            </p>
          )}
          {!result ? (
            <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">上でお会計の合計を入れると、集金のページを作れます</p>
          ) : collection ? (
            <div className="mt-4 grid gap-2">
              <Link href={`/c/${collection.id}?token=${collection.token}`} className={`${BUTTON_PRIMARY} w-full gap-2`}>
                <ExternalLink className="size-5" aria-hidden />
                集金のページを開く
              </Link>
              <button type="button" onClick={makeCollection} disabled={collecting} className={`${BUTTON_SUB} w-full text-sm`}>
                {collecting ? "作っています…" : "金額を変えたので作り直す"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={makeCollection} disabled={collecting} className={`${BUTTON_PRIMARY} mt-4 w-full gap-2`}>
              <Wallet className="size-5" aria-hidden />
              {collecting ? "作っています…" : "集金のページを作る"}
            </button>
          )}
      </section>

      <div className="mx-4 mt-4">
        <button type="button" onClick={startOver} className={`${BUTTON_SUB} w-full gap-2 text-sm`}>
          <RotateCcw className="size-4" aria-hidden />
          新しい会計を始める
        </button>
      </div>
      {result && (
        <div className="mx-4 mt-4">
          <NextHost />
        </div>
      )}
    </>
  );
}
