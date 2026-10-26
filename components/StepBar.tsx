import { CalendarDays, Calculator, Store } from "lucide-react";

// 飲み会のどの段階にいるか。もとにした KANJI と同じく、上のバーの下に3つの段階を細い線で並べる
const STEPS = [
  { Icon: CalendarDays, label: "日程調整" },
  { Icon: Store, label: "お店探し" },
  { Icon: Calculator, label: "会計精算" },
] as const;

export function StepBar({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="mt-2 flex gap-2" aria-label="飲み会の段階">
      {STEPS.map(({ Icon, label }, i) => {
        const done = i <= current;
        return (
          <li key={label} className="flex flex-1 flex-col gap-1.5" aria-current={i === current ? "step" : undefined}>
            <div className="flex items-center gap-1.5">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-lg transition-colors duration-300 ${
                  done ? "bg-accent/20 text-accent" : "bg-white/6 text-white/20"
                }`}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className={`h-[3px] flex-1 rounded-full transition-all duration-500 ${done ? "bg-accent/60" : "bg-white/12"}`} />
            </div>
            <span className={`pl-0.5 text-[9px] font-black tracking-[0.14em] ${done ? "text-accent/80" : "text-white/25"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
