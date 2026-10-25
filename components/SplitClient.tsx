"use client";

import { Check, Crown, NotebookPen, PencilLine, Plus, RotateCcw, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { loadAudience, type Audience } from "@/lib/audience";
import { yen } from "@/lib/sendai";
import { MADE_WITH, reminderText } from "@/lib/share";
import { NextHost } from "./NextHost";
import { SendButtons, useCanShare } from "./SendButtons";
import { ROUND_UNITS, WEIGHTS, splitBill, tenthsFromInput, type Weight } from "@/lib/split";
import { BUTTON_SUB, PILL, PILL_OFF, PILL_ON } from "./ui";

// 傾斜会計。hasuru と同じく、区分ごとに色・記号・頭文字の丸で人を見分ける(色だけに頼らない)

/**
 * weight は区分の key。自分で倍率を書いたときは "custom" にして、書いた文字を custom に持つ。
 * paid は幹事に払い終えたか(幹事本人は数えない)
 */
type Person = { id: number; name: string; weight: string; custom: string; paid: boolean };

/** 幹事の画面から「この会の傾斜会計」で来たとき、行く人の名前を受け取る(URL には載せない) */
export const SPLIT_NAMES_KEY = "nomi:split-names";

/** 集金が終わるまで続きから使えるよう、最後の会計をこの端末に残す(サーバーには送らない) */
const SAVE_KEY = "nomi:split";
type Saved = { title: string; total: string; people: Person[]; unit: number; organizer: number };

function loadSaved(): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null") as Saved | null;
    return v && Array.isArray(v.people) && v.people.length > 0 ? v : null;
  } catch {
    return null;
  }
}

let nextId = 1;
const person = (weight: string, name = ""): Person => ({ id: nextId++, name, weight, custom: "", paid: false });
const startPeople = () => [person("normal", "幹事"), person("normal"), person("normal"), person("normal")];

function Avatar({ name, tone, size = "md" }: { name: string; tone: Weight["tone"]; size?: "sm" | "md" }) {
  const initial = [...name.trim()][0] ?? "?";
  return (
    <span
      aria-hidden
      className={`tier-${tone} grid shrink-0 place-items-center rounded-full bg-[var(--ts)] font-extrabold text-[var(--tc)] ring-1 ring-[var(--tb)]/40 ${
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
  const [origin, setOrigin] = useState("");
  const [loaded, setLoaded] = useState(false);
  const canShare = useCanShare();

  useEffect(() => {
    const a = loadAudience() ?? "student";
    let names: string[] = [];
    try {
      names = JSON.parse(sessionStorage.getItem(SPLIT_NAMES_KEY) ?? "[]");
      sessionStorage.removeItem(SPLIT_NAMES_KEY);
    } catch {}
    const saved = names.length > 0 ? null : loadSaved();
    /* eslint-disable react-hooks/set-state-in-effect */
    setAudience(a);
    setOrigin(location.origin);
    if (saved) {
      // 前の会計の続き。足す人の番号が重ならないようにする
      nextId = Math.max(...saved.people.map((p) => p.id)) + 1;
      setTitle(saved.title ?? "");
      setTotal(saved.total ?? "");
      setPeople(saved.people.map((p) => ({ ...p, custom: p.custom ?? "", paid: p.paid === true })));
      setUnit(saved.unit ?? 100);
      setOrganizer(saved.organizer ?? 0);
    } else {
      setPeople(names.length > 0 ? names.slice(0, 30).map((n) => person("normal", String(n).slice(0, 20))) : startPeople());
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 変えるたびにこの端末に残す(読み込みが済むまでは上書きしない)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ title, total, people, unit, organizer } satisfies Saved));
    } catch {}
  }, [loaded, title, total, people, unit, organizer]);

  function startOver() {
    if (!window.confirm("いまの会計を消して、新しい会計を始めますか?")) return;
    setTitle("");
    setTotal("");
    setPeople(startPeople());
    setUnit(100);
    setOrganizer(0);
  }

  const weights = WEIGHTS[audience];
  const normal = weights.find((w) => w.key === "normal")!;
  const weightOf = (p: Person): Weight => {
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
        ...people.map((p, i) => `${weightOf(p).mark} ${nameOf(p, i)} ${yen(result.amounts[i])}`),
        "",
        `${MADE_WITH}(傾斜会計)`,
        origin,
      ].join("\n")
    : "";

  // 集金の進み具合。幹事は店に払っている本人なので数えない
  const payers = result ? people.map((p, i) => ({ p, i, amount: result.amounts[i] })).filter(({ i }) => i !== organizer) : [];
  const unpaid = payers.filter(({ p }) => !p.paid);
  const unpaidYen = unpaid.reduce((sum, u) => sum + u.amount, 0);
  const remind = reminderText(
    audience,
    title,
    unpaid.map(({ p, i, amount }) => ({ name: nameOf(p, i), amount })),
  );

  return (
    <>
      {/* 何の会計かのメモ。催促の文にも入る */}
      <label className="mx-4 mb-3 flex items-center gap-3 rounded-3xl border border-border bg-surface px-5 py-3">
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
      <label className="mx-4 block rounded-3xl border border-border bg-surface px-5 py-5">
        <span className="text-sm font-bold text-muted">お会計の合計</span>
        <span className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-muted">¥</span>
          <input
            className="w-full min-w-0 bg-transparent text-4xl font-extrabold tracking-tight tabular-nums outline-none placeholder:text-border"
            inputMode="numeric"
            value={total === "" ? "" : Number(total).toLocaleString("ja-JP")}
            onChange={(e) => setTotal(e.target.value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 7))}
            placeholder="0"
            aria-label="お会計の合計(円)"
          />
        </span>
      </label>

      {/* 区分の見本 */}
      <div className="mx-4 mt-4 flex flex-wrap gap-1.5" aria-label="傾斜の区分">
        {weights.map((w) => (
          <span key={w.key} className={`tier-${w.tone} inline-flex items-center gap-1 rounded-full bg-[var(--ts)] px-2.5 py-1 text-xs font-bold text-[var(--tc)]`}>
            <span aria-hidden>{w.mark}</span>
            {w.label} ×{(w.tenths / 10).toFixed(1)}
          </span>
        ))}
      </div>

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
              {customOn && (
                <label className="mt-2.5 flex items-center gap-2">
                  <span className="text-lg font-extrabold text-[var(--tc)]" aria-hidden>
                    ×
                  </span>
                  <input
                    className="min-h-11 w-24 rounded-xl bg-surface-2 px-3 text-lg font-extrabold tabular-nums outline-none placeholder:font-normal placeholder:text-muted focus:ring-1 focus:ring-[var(--tb)]"
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
          <h2 className="text-lg font-extrabold">1人いくら?</h2>
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
                        <TierTag w={w} />
                        {organizer === i && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-accent-text">
                            <Crown className="size-3" aria-hidden />
                            幹事
                          </span>
                        )}
                      </span>
                    </span>
                    <span className={`shrink-0 text-lg font-extrabold tabular-nums ${organizer !== i && p.paid ? "text-muted line-through decoration-2" : ""}`}>
                      {yen(result.amounts[i])}
                    </span>
                    {/* 払ったかの印。色だけでなく ✓ と文字でも分かるようにする */}
                    {organizer === i ? (
                      <span className="w-[4.5rem] shrink-0 text-center text-[11px] font-bold text-muted">立て替え</span>
                    ) : (
                      <button
                        type="button"
                        aria-pressed={p.paid}
                        aria-label={`${nameOf(p, i)}は${p.paid ? "払い済み(押すと未払いに戻す)" : "まだ(押すと払い済みにする)"}`}
                        onClick={() => update(p.id, { paid: !p.paid })}
                        className={`tier-green inline-flex min-h-10 w-[4.5rem] shrink-0 items-center justify-center gap-1 rounded-full border text-xs font-bold transition-colors ${
                          p.paid ? "border-[var(--tb)] bg-[var(--tb)] text-black" : "border-white/15 bg-surface-2 text-text hover:border-white/30"
                        }`}
                      >
                        {p.paid ? <Check className="size-3.5" aria-hidden /> : null}
                        {p.paid ? "済み" : "まだ"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="flex items-baseline justify-between border-t-2 border-text/80 px-5 py-3">
              <span className="text-sm font-bold">合計</span>
              <span className="flex items-center gap-2">
                <span className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[#93e3b2] ring-1 ring-[#93e3b2]/60">✓ 一致</span>
                <span className="text-lg font-extrabold tabular-nums">{yen(totalYen)}</span>
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
              />
            </div>
          </>
        ) : (
          <p className="px-5 pt-2 pb-5 text-sm text-muted">合計を入れると、一人ずつの金額が出ます</p>
        )}
      </section>

      {/* 集金。誰が払ったかを幹事がメモし、まだの人にだけ催促を送る */}
      {result && payers.length > 0 && (
        <section className="mx-4 mt-4 rounded-3xl border border-border bg-surface px-5 py-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Wallet className="size-5" aria-hidden />
            集金
          </h2>
          <p className="mt-1 text-sm">
            <span className="font-bold">
              {payers.length}人中{payers.length - unpaid.length}人が払いました
            </span>
            {unpaid.length > 0 && <span className="text-muted">(あと{yen(unpaidYen)})</span>}
          </p>
          <div className="tier-green mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div
              className="h-full rounded-full bg-[var(--tb)] transition-[width]"
              style={{ width: `${((payers.length - unpaid.length) / payers.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">上の金額の横の「まだ」を押すと「済み」になります。この端末に残るので、閉じても続きから使えます</p>

          {unpaid.length === 0 ? (
            <p className="tier-green mt-4 flex items-center gap-2 rounded-2xl bg-[var(--ts)] px-4 py-3 text-sm font-bold text-[var(--tc)]">
              <Check className="size-4" aria-hidden />
              全員の支払いがそろいました
            </p>
          ) : (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="font-extrabold">まだの人に催促する</h3>
              <p className="mt-1 text-xs text-muted">まだの{unpaid.length}人の名前と金額だけが入ります。払った人の名前は出ません</p>
              <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">{remind}</p>
              <SendButtons
                mainLabel="共有して催促を送る"
                line={remind}
                share={{ text: remind }}
                copy={remind}
                copyLabel="催促の文をコピー"
                canShare={canShare}
              />
            </div>
          )}
        </section>
      )}

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
