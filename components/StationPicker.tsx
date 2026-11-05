"use client";

import { Check, Search, TrainFront } from "lucide-react";
import { useState, useTransition } from "react";
import { searchStations } from "@/app/actions";
import type { Station } from "@/lib/stations";
import { INPUT, PILL, PILL_OFF, PILL_ON } from "./ui";

// 行きやすい駅を1つ選ぶ。駅名を入れて探し、出てきた駅から選ぶ(全国)。
// 選ばなければ「どこでもいい」(場所はほかの人の駅で決まる)

export function StationPicker({ value, onChange }: { value: Station | null; onChange: (s: Station | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Station[] | null>(null);
  const [pending, start] = useTransition();

  function find() {
    const q = query.trim();
    if (!q) return;
    start(async () => setResults(await searchStations(q)));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={`${PILL} px-3 ${value === null ? PILL_ON : PILL_OFF}`}>
          {value === null && <Check className="size-3.5 shrink-0" aria-hidden />}
          どこでもいい
        </button>
        {value && (
          <span className={`${PILL} px-3 ${PILL_ON}`}>
            <Check className="size-3.5 shrink-0" aria-hidden />
            {value.name}駅
            <span className="text-xs font-bold opacity-70">({value.pref})</span>
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">駅名</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                find();
              }
            }}
            placeholder="駅名(例: 仙台、渋谷)"
            enterKeyHint="search"
            className={INPUT}
          />
        </label>
        <button
          type="button"
          onClick={find}
          disabled={pending || !query.trim()}
          aria-label="駅を探す"
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/8 ring-1 ring-white/12 transition active:scale-95 disabled:opacity-40"
        >
          <Search className="size-5" aria-hidden />
        </button>
      </div>
      {pending && <p className="text-xs text-muted">探しています…</p>}
      {!pending && results !== null && results.length === 0 && (
        <p className="text-xs text-muted">見つからない駅名。「駅」を付けずに、正しい名前で</p>
      )}
      {!pending && results && results.length > 0 && (
        <ul className="space-y-1.5" aria-label="見つかった駅">
          {results.map((s) => {
            const on = value?.name === s.name && value.pref === s.pref;
            return (
              <li key={`${s.name}-${s.pref}`}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    onChange(s);
                    setResults(null);
                    setQuery("");
                  }}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-bold ring-1 transition ${
                    on ? "bg-accent text-accent-text ring-accent" : "bg-white/6 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  <TrainFront className="size-4 shrink-0" aria-hidden />
                  <span className="flex-1">{s.name}駅</span>
                  <span className="text-xs opacity-70">{s.pref}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
