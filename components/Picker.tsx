"use client";

import { ChevronDown } from "lucide-react";

// たくさんの選択肢から1つ選ぶ欄。幹事の「開始時刻」と同じ形で、今の値を大きく見せ、押すとスマホの選ぶ画面が開く。
// 選ぶ画面は、スマホによって白い地に白い字にならないよう、暗い地に白い字に決めておく

export function Picker<T extends number>({
  label,
  value,
  options,
  onChange,
  placeholder = "選んでください",
}: {
  label: string;
  /** まだ選んでいないときは 0 */
  value: T | 0;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <label className="relative flex min-h-14 items-center justify-between rounded-2xl bg-white/6 px-4 ring-1 ring-white/10">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <span className={`flex items-center gap-1.5 font-black tabular-nums ${current ? "text-xl" : "text-sm text-accent"}`}>
        {current ? current.label : placeholder}
        <ChevronDown className="size-5 text-accent" aria-hidden />
      </span>
      <select
        value={current ? String(value) : ""}
        onChange={(e) => onChange(Number(e.target.value) as T)}
        aria-label={label}
        className="absolute inset-0 cursor-pointer text-white opacity-0 [color-scheme:dark]"
      >
        {!current && (
          <option value="" disabled className="bg-[#1c1a17] text-white">
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1c1a17] text-white">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
