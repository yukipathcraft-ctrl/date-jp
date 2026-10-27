"use client";

import { Send, Shuffle, Users } from "lucide-react";
import { useState } from "react";
import { assignSeats, parseNames, seatsText } from "@/lib/seats";
import { lineShareUrl } from "@/lib/share";
import { BUTTON_LINE, BUTTON_PRIMARY, BUTTON_SUB, CARD, INPUT, LABEL, PILL, PILL_OFF, PILL_ON } from "./ui";

const TABLE_CHOICES = [2, 3, 4, 5, 6];

export function SeatsClient() {
  const [text, setText] = useState("");
  const [tables, setTables] = useState(2);
  const [result, setResult] = useState<string[][] | null>(null);
  const names = parseNames(text);
  const ready = names.length >= 2;

  return (
    <div className="space-y-4">
      <section className={`${CARD} px-5 py-5`}>
        <label className="block">
          <span className={LABEL}>
            <Users className="size-4" aria-hidden />
            来る人の名前 <span className="font-normal">(1行に1人)</span>
          </span>
          <textarea
            className={`${INPUT} min-h-40 resize-none py-3 leading-relaxed`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"山田\n佐藤\n鈴木"}
          />
        </label>
        <p className="mt-2 text-xs text-muted">{names.length}人</p>

        <p className={`${LABEL} mt-5`}>テーブルの数</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="テーブルの数">
          {TABLE_CHOICES.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={tables === n}
              onClick={() => setTables(n)}
              className={`${PILL} px-4 ${tables === n ? PILL_ON : PILL_OFF}`}
            >
              {n}卓
            </button>
          ))}
        </div>
      </section>

      <div className="px-4">
        <button
          type="button"
          disabled={!ready}
          onClick={() => setResult(assignSeats(names, tables))}
          className={`${BUTTON_PRIMARY} w-full gap-2`}
        >
          <Shuffle className="size-5" aria-hidden />
          {!ready ? "名前を2人以上入れてください" : result ? "もう一度くじを引く" : "くじで席を決める"}
        </button>
      </div>

      {result && (
        <section className="anim-rise space-y-2.5 px-4" aria-live="polite">
          <div className="grid grid-cols-2 gap-2.5">
            {result.map((t, i) => (
              <div key={i} className="rounded-2xl bg-surface px-4 py-4 ring-1 ring-white/8">
                <p className="text-[11px] font-black tracking-[0.14em] text-accent">{i + 1}卓</p>
                <ul className="mt-2 space-y-1 text-[15px] font-bold">
                  {t.map((name, j) => (
                    <li key={j}>{name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <a href={lineShareUrl(seatsText(result))} target="_blank" rel="noreferrer" className={`${BUTTON_LINE} w-full gap-2`}>
            <Send className="size-4" aria-hidden />
            LINEで送る
          </a>
          <button type="button" onClick={() => setResult(null)} className={`${BUTTON_SUB} w-full`}>
            名前を直す
          </button>
        </section>
      )}
    </div>
  );
}
