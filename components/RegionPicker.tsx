"use client";

import { Check, MapPinned, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { searchRegions } from "@/app/actions";
import type { Region } from "@/lib/region";
import { INPUT, PILL, PILL_OFF, PILL_ON } from "./ui";

/**
 * 地域を選ぶ。仙台(本拠地)はそのまま押せて、ほかの地域は名前で探す(ホットペッパーの地域の一覧から)。
 * value が null なら仙台
 */
export function RegionPicker({ value, onChange }: { value: Region; onChange: (r: Region) => void }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<{ code: string; name: string; pref: string }[] | null>(null);
  const [pending, start] = useTransition();

  function search() {
    if (!keyword.trim()) return;
    start(async () => setResults(await searchRegions(keyword)));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="地域">
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className={`${PILL} px-4 ${value === null ? PILL_ON : PILL_OFF}`}
        >
          {value === null && <Check className="size-3.5" aria-hidden />}
          仙台
        </button>
        {value && (
          <button type="button" aria-pressed onClick={() => setOpen(true)} className={`${PILL} max-w-full px-4 ${PILL_ON}`}>
            <Check className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{value.name}</span>
          </button>
        )}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`${PILL} gap-1.5 px-4 ${PILL_OFF}`}
        >
          <MapPinned className="size-4" aria-hidden />
          {value ? "地域を変える" : "ほかの地域"}
        </button>
      </div>

      {open && (
        <div className="anim-rise mt-3 space-y-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <input
              className={`${INPUT} min-h-12 text-sm`}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="例: 渋谷、梅田、天神、すすきの"
              aria-label="地域の名前"
              maxLength={20}
            />
            <button
              type="submit"
              disabled={pending || !keyword.trim()}
              aria-label="地域を探す"
              className="grid min-h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-text transition active:scale-95 disabled:bg-white/10 disabled:text-white/30"
            >
              <Search className="size-5" aria-hidden />
            </button>
          </form>
          {pending && <p className="text-xs text-white/40">探しています…</p>}
          {!pending && results && results.length === 0 && (
            <p className="text-xs text-white/50">見つかりませんでした。駅や繁華街の名前で探してみてください</p>
          )}
          {!pending && results && results.length > 0 && (
            <ul className="space-y-1.5">
              {results.map((r) => (
                <li key={r.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ code: r.code, name: r.name });
                      setOpen(false);
                      setResults(null);
                      setKeyword("");
                    }}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-white/5 px-3.5 py-2 text-left ring-1 ring-white/10 transition hover:bg-white/10"
                  >
                    <span className="min-w-0 truncate text-sm font-bold">{r.name}</span>
                    <span className="shrink-0 text-[11px] text-white/40">{r.pref}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
