"use client";

import { ChevronDown, X } from "lucide-react";
import { Fragment } from "react";

// いくつでも選べるものを、▼ で1つずつ選んで足していく欄(アレルギー・苦手なもの・食べたいもの)。
// 選択肢が多くても画面が長くならないよう、選んだものだけを下に札で並べ、× で外せるようにする。
// 選ぶ画面は、スマホによって白い地に白い字にならないよう、暗い地に白い字に決めておく

type Option = { key: string; label: string };

export function AddPicker({
  label,
  groups,
  selected,
  onToggle,
  tone,
}: {
  /** 読み上げ用の名前(「苦手なもの・アレルギー」など) */
  label: string;
  /** 選択肢。見出しで分けるときは group に見出しを入れる */
  groups: { group?: string; options: readonly Option[] }[];
  selected: string[];
  onToggle: (key: string) => void;
  /** 選んだものの札の色(globals.css の .tier-*) */
  tone: "red" | "green";
}) {
  const all = groups.flatMap((g) => g.options);
  const chosen = all.filter((o) => selected.includes(o.key));
  const optionClass = "bg-[#1c1a17] text-white";
  return (
    <>
      <label className="relative flex min-h-12 items-center justify-between rounded-2xl bg-white/6 px-4 ring-1 ring-white/10">
        <span className="text-sm font-bold text-white/60">選んで足す</span>
        <span className="flex items-center gap-1.5 text-sm font-black text-accent">
          {chosen.length > 0 ? `${chosen.length}つ選んでいます` : "なし"}
          <ChevronDown className="size-5" aria-hidden />
        </span>
        <select
          value=""
          onChange={(e) => e.target.value && onToggle(e.target.value)}
          aria-label={`${label}を選んで足す`}
          className="absolute inset-0 cursor-pointer text-white opacity-0 [color-scheme:dark]"
        >
          <option value="" disabled className={optionClass}>
            選んでください
          </option>
          {groups.map((g, i) => {
            const rest = g.options.filter((o) => !selected.includes(o.key));
            const items = rest.map((o) => (
              <option key={o.key} value={o.key} className={optionClass}>
                {o.label}
              </option>
            ));
            return g.group ? (
              <optgroup key={g.group} label={g.group} className={optionClass}>
                {items}
              </optgroup>
            ) : (
              <Fragment key={i}>{items}</Fragment>
            );
          })}
        </select>
      </label>
      {chosen.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {chosen.map((o) => (
            <li key={o.key}>
              <button
                type="button"
                onClick={() => onToggle(o.key)}
                aria-label={`${o.label}を外す`}
                className={`tier-${tone} inline-flex min-h-10 items-center gap-1 rounded-full bg-[var(--ts)] pr-2 pl-3 text-sm font-bold text-[var(--tc)]`}
              >
                {o.label}
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
