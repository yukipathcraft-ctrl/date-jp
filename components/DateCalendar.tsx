"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { dateLabel } from "@/lib/sendai";

// 候補の日を、月のカレンダーから選ぶ。今日から CALENDAR_DAYS 日先まで選べる。
// 曜日の色は近い日の並びと同じ(金は黄、土は青、日は赤)。選んだ日は金色の地に✓

export const CALENDAR_DAYS = 90;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-10-26" の形。日付だけを扱うので UTC で計算する */
function iso(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return iso(y, m - 1, d + n);
}

function weekdayColor(w: number): string {
  return w === 0 ? "text-danger" : w === 6 ? "text-[#7fb2ff]" : w === 5 ? "text-[#ffd47e]" : "text-text";
}

export function DateCalendar({
  today,
  selected,
  onToggle,
}: {
  /** 今日("2026-10-26")。ブラウザで開いたときの日付 */
  today: string;
  selected: string[];
  onToggle: (day: string) => void;
}) {
  const [ty, tm] = today.split("-").map(Number);
  const last = addDays(today, CALENDAR_DAYS - 1);
  const [ly, lm] = last.split("-").map(Number);
  const maxOffset = (ly - ty) * 12 + (lm - tm);
  const [offset, setOffset] = useState(0);

  const first = new Date(Date.UTC(ty, tm - 1 + offset, 1));
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const blanks = first.getUTCDay();

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          disabled={offset === 0}
          aria-label="前の月"
          className="grid size-11 place-items-center rounded-full text-text hover:bg-surface-2 disabled:opacity-25"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="font-black" aria-live="polite">
          {year}年{month + 1}月
        </p>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          disabled={offset >= maxOffset}
          aria-label="次の月"
          className="grid size-11 place-items-center rounded-full text-text hover:bg-surface-2 disabled:opacity-25"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center" aria-hidden>
        {WEEKDAYS.map((w, i) => (
          <span key={w} className={`text-[11px] font-bold ${weekdayColor(i)}`}>
            {w}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = iso(year, month, i + 1);
          const w = (blanks + i) % 7;
          const on = selected.includes(day);
          const out = day < today || day > last;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggle(day)}
              disabled={out}
              aria-pressed={on}
              aria-label={dateLabel(day)}
              className={`relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-sm font-black tabular-nums transition-colors disabled:opacity-25 ${
                on ? "bg-accent text-accent-text" : `bg-surface-2 hover:ring-1 hover:ring-muted ${weekdayColor(w)}`
              } ${day === today && !on ? "ring-1 ring-accent" : ""}`}
            >
              {i + 1}
              {on && <Check className="size-3" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
