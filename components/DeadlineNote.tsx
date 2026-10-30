import { AlarmClock, CalendarCheck } from "lucide-react";
import type { DeadlineState } from "@/lib/deadline";

// 回答の締め切り。みんなの画面のいちばん上に出す。
// 明日までになったら金の枠で目立たせ、過ぎたら灰色にする(色だけでなく、アイコンと文字でも分かるようにする)

export function DeadlineNote({ state }: { state: DeadlineState }) {
  if (state.kind === "past") {
    return (
      <p className="mx-4 mb-3 flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
        <CalendarCheck className="size-4 shrink-0" aria-hidden />
        <span>
          回答の{state.text}。まだの人も今から回答OK
        </span>
      </p>
    );
  }
  const soon = state.daysLeft <= 1;
  return (
    <p
      className={`mx-4 mb-3 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
        soon ? "border border-accent bg-accent/10 font-bold text-accent" : "bg-surface-2 text-text"
      }`}
    >
      <AlarmClock className="size-4 shrink-0" aria-hidden />
      <span>
        <span className="font-black">回答の締め切り</span> {state.text}
      </span>
    </p>
  );
}
