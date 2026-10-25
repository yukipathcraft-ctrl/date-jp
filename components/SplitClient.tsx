"use client";

import { Calculator, Check, Crown, Plus, Send, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { loadAudience, type Audience } from "@/lib/audience";
import { yen } from "@/lib/sendai";
import { lineShareUrl } from "@/lib/share";
import { ROUND_UNITS, WEIGHTS, splitBill } from "@/lib/split";
import { BUTTON_LINE, BUTTON_SUB, INPUT, LABEL, PILL, PILL_OFF, PILL_ON } from "./ui";

type Person = { id: number; name: string; weight: string };

let nextId = 1;
const person = (weight: string, name = ""): Person => ({ id: nextId++, name, weight });

export function SplitClient() {
  const [audience, setAudience] = useState<Audience>("student");
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [unit, setUnit] = useState<number>(100);
  const [organizer, setOrganizer] = useState(0);

  useEffect(() => {
    const a = loadAudience() ?? "student";
    /* eslint-disable react-hooks/set-state-in-effect */
    setAudience(a);
    setPeople([person("normal", "幹事"), person("normal"), person("normal"), person("normal")]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const weights = WEIGHTS[audience];
  const tenthsOf = (key: string) => weights.find((w) => w.key === key)?.tenths ?? 10;
  const labelOf = (key: string) => weights.find((w) => w.key === key)?.label ?? "ふつう";
  const totalYen = Number(total.replace(/[^\d]/g, ""));
  const ready = Number.isInteger(totalYen) && totalYen > 0 && people.length > 0;
  const result = ready
    ? splitBill({ total: totalYen, weights: people.map((p) => tenthsOf(p.weight)), unit, organizer })
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
        ...people.map((p, i) => `${nameOf(p, i)}(${labelOf(p.weight)}) ${yen(result.amounts[i])}`),
        "Date で計算しました",
      ].join("\n")
    : "";

  return (
    <>
      <div className="mx-4 overflow-hidden rounded-3xl border border-border bg-surface">
        <label className="block border-b border-border px-5 py-5">
          <span className={LABEL}>
            <Calculator className="size-4" aria-hidden />
            お会計の合計
          </span>
          <span className="relative block">
            <input
              className={`${INPUT} pr-12 text-right text-2xl font-extrabold`}
              inputMode="numeric"
              value={total}
              onChange={(e) => setTotal(e.target.value.replace(/[^\d]/g, "").slice(0, 7))}
              placeholder="0"
            />
            <span className="absolute top-1/2 right-5 -translate-y-1/2 font-bold text-muted">円</span>
          </span>
        </label>

        <div className="border-b border-border px-5 py-5">
          <p className={LABEL}>
            <Users className="size-4" aria-hidden />
            払う人と傾斜 <span className="font-normal">(王冠が幹事。端数を受け持ちます)</span>
          </p>
          <ul className="space-y-4">
            {people.map((p, i) => (
              <li key={p.id} className="rounded-2xl bg-surface-2 p-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrganizer(i)}
                    aria-pressed={organizer === i}
                    aria-label={`${nameOf(p, i)}を幹事にする`}
                    className={`grid size-11 shrink-0 place-items-center rounded-full border ${
                      organizer === i ? "border-accent bg-accent text-accent-text" : "border-border text-muted"
                    }`}
                  >
                    <Crown className="size-5" aria-hidden />
                  </button>
                  <input
                    className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 outline-none placeholder:text-muted focus:border-accent"
                    value={p.name}
                    onChange={(e) => update(p.id, { name: e.target.value.slice(0, 20) })}
                    placeholder={`${i + 1}人目の名前(なくてもOK)`}
                  />
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
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {weights.map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      aria-pressed={p.weight === w.key}
                      onClick={() => update(p.id, { weight: w.key })}
                      className={`${PILL} min-h-10 px-3 text-xs ${p.weight === w.key ? PILL_ON : PILL_OFF}`}
                    >
                      {p.weight === w.key && <Check className="size-3" aria-hidden />}
                      {w.label}
                      <span className="opacity-70">×{(w.tenths / 10).toFixed(1)}</span>
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setPeople((ps) => [...ps, person("normal")])}
            disabled={people.length >= 30}
            className={`${BUTTON_SUB} mt-3 w-full gap-2`}
          >
            <Plus className="size-4" aria-hidden />
            人を足す
          </button>
        </div>

        <div className="px-5 py-5">
          <p className={LABEL}>何円単位にそろえる?</p>
          <div className="flex flex-wrap gap-2">
            {ROUND_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className={`${PILL} ${unit === u ? PILL_ON : PILL_OFF}`}
              >
                {unit === u && <Check className="size-3.5" aria-hidden />}
                {u}円
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="glow mx-4 mt-4 rounded-3xl border border-accent/40 bg-surface px-5 py-5" aria-live="polite">
        <h2 className="text-lg font-extrabold">1人いくら?</h2>
        {result ? (
          <>
            <ul className="mt-3 divide-y divide-border">
              {people.map((p, i) => (
                <li key={p.id} className="flex min-h-12 items-center gap-2">
                  {organizer === i && <Crown className="size-4 shrink-0 text-accent" aria-label="幹事" />}
                  <span className="min-w-0 flex-1 truncate font-bold">{nameOf(p, i)}</span>
                  <span className="text-xs text-muted">{labelOf(p.weight)}</span>
                  <span className="w-24 text-right text-lg font-extrabold">{yen(result.amounts[i])}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              合計 {yen(totalYen)}。
              {result.organizerDiff === 0
                ? "端数はありません。"
                : `幹事は端数で${yen(Math.abs(result.organizerDiff))}${result.organizerDiff > 0 ? "多く" : "少なく"}払います。`}
            </p>
            <a href={lineShareUrl(shareText)} className={`${BUTTON_LINE} mt-4 w-full gap-2`}>
              <Send className="size-4" aria-hidden />
              LINEで金額を送る
            </a>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">合計を入れると、1人ずつの金額が出ます。</p>
        )}
      </section>
    </>
  );
}
