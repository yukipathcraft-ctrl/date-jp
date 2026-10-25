"use client";

import { Check, Copy, Crown, Plus, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { loadAudience, type Audience } from "@/lib/audience";
import { yen } from "@/lib/sendai";
import { lineShareUrl } from "@/lib/share";
import { ROUND_UNITS, WEIGHTS, splitBill, type Weight } from "@/lib/split";
import { BUTTON_LINE, BUTTON_SUB, PILL, PILL_OFF, PILL_ON } from "./ui";

// 傾斜会計。hasuru と同じく、区分ごとに色・記号・頭文字の丸で人を見分ける(色だけに頼らない)

type Person = { id: number; name: string; weight: string };

/** 幹事の画面から「この会の傾斜会計」で来たとき、行く人の名前を受け取る(URL には載せない) */
export const SPLIT_NAMES_KEY = "nomi:split-names";

let nextId = 1;
const person = (weight: string, name = ""): Person => ({ id: nextId++, name, weight });

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
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [unit, setUnit] = useState<number>(100);
  const [organizer, setOrganizer] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = loadAudience() ?? "student";
    let names: string[] = [];
    try {
      names = JSON.parse(sessionStorage.getItem(SPLIT_NAMES_KEY) ?? "[]");
      sessionStorage.removeItem(SPLIT_NAMES_KEY);
    } catch {}
    /* eslint-disable react-hooks/set-state-in-effect */
    setAudience(a);
    setPeople(
      names.length > 0
        ? names.slice(0, 30).map((n) => person("normal", String(n).slice(0, 20)))
        : [person("normal", "幹事"), person("normal"), person("normal"), person("normal")],
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const weights = WEIGHTS[audience];
  const weightOf = (key: string) => weights.find((w) => w.key === key) ?? weights.find((w) => w.key === "normal")!;
  const totalYen = Number(total);
  const ready = Number.isInteger(totalYen) && totalYen > 0 && people.length > 0;
  const result = ready
    ? splitBill({ total: totalYen, weights: people.map((p) => weightOf(p.weight).tenths), unit, organizer })
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
        `お会計 ${yen(totalYen)}(${people.length}人)`,
        ...people.map((p, i) => `${weightOf(p.weight).mark} ${nameOf(p, i)} ${yen(result.amounts[i])}`),
        "Date で傾斜会計しました",
      ].join("\n")
    : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <>
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
          const w = weightOf(p.weight);
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
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mx-4 mt-2 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={() => setPeople((ps) => [...ps, person("normal")])}
          disabled={people.length >= 30}
          className={`${BUTTON_SUB} gap-2`}
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
          {result && <span className="text-xs font-bold text-muted">{unit}円単位・端数は幹事</span>}
        </div>
        {result ? (
          <>
            {/* 誰がどれだけ持つかを、区分の色の帯で見せる */}
            <div className="mx-5 mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden>
              {people.map((p, i) => (
                <span
                  key={p.id}
                  className={`tier-${weightOf(p.weight).tone} h-full bg-[var(--tb)] [&:not(:first-child)]:border-l-2 [&:not(:first-child)]:border-surface`}
                  style={{ width: `${(result.amounts[i] / totalYen) * 100}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 divide-y divide-border">
              {people.map((p, i) => {
                const w = weightOf(p.weight);
                return (
                  <li key={p.id} className="flex min-h-14 items-center gap-3 px-5">
                    <Avatar name={nameOf(p, i)} tone={w.tone} size="sm" />
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="truncate font-bold">{nameOf(p, i)}</span>
                      <TierTag w={w} />
                      {organizer === i && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-accent-text">
                          <Crown className="size-3" aria-hidden />
                          幹事
                        </span>
                      )}
                    </span>
                    <span className="text-xl font-extrabold tabular-nums">{yen(result.amounts[i])}</span>
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
                ? "端数はありません。"
                : `幹事は端数で${yen(Math.abs(result.organizerDiff))}${result.organizerDiff > 0 ? "多く" : "少なく"}払います。`}
            </p>
            <div className="grid gap-2 p-5">
              <a href={lineShareUrl(shareText)} className={`${BUTTON_LINE} w-full gap-2`}>
                <Send className="size-4" aria-hidden />
                LINEで金額を送る
              </a>
              <button type="button" onClick={copy} className={`${BUTTON_SUB} w-full gap-2`}>
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                <span aria-live="polite">{copied ? "コピーしました" : "金額をコピー"}</span>
              </button>
            </div>
          </>
        ) : (
          <p className="px-5 pt-2 pb-5 text-sm text-muted">合計を入れると、1人ずつの金額が出ます。</p>
        )}
      </section>
    </>
  );
}
