"use client";

import { AlarmClock, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setDeadline } from "@/app/actions";
import { DEADLINE_CHOICES, addDays, choiceAllowed, deadlineState } from "@/lib/deadline";
import { dateLabel } from "@/lib/sendai";
import { deadlineReminderText } from "@/lib/share";
import { SendButtons, useCanShare } from "./SendButtons";
import { PILL, PILL_OFF, PILL_ON } from "./ui";

// 幹事の画面で、回答の締め切りを決める・変える。締め切りが近いときは、まだの人への一言も送れる

export function DeadlineEditor({
  partyId,
  token,
  title,
  guestUrl,
  deadline,
  today,
  dates,
}: {
  partyId: string;
  token: string;
  title: string;
  guestUrl: string;
  deadline: string | null;
  today: string;
  /** 候補の日。いちばん早い候補の日以降の締め切りは選べないようにする */
  dates: string[];
}) {
  const router = useRouter();
  const canShare = useCanShare();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const state = deadlineState(deadline, today);
  const choices = [
    { value: null, label: "なし" },
    ...DEADLINE_CHOICES.map((c) => ({ value: addDays(today, c.days), label: `${c.label}(${dateLabel(addDays(today, c.days))})` })).filter(
      (c) => choiceAllowed(c.value, dates),
    ),
  ];
  // 今の締め切りが選択肢にない日(前に決めた日)なら、それも並べておく
  if (deadline && !choices.some((c) => c.value === deadline)) choices.splice(1, 0, { value: deadline, label: `${dateLabel(deadline)}まで` });

  function choose(value: string | null) {
    if (value === deadline) return;
    setError(null);
    start(async () => {
      const r = await setDeadline(partyId, token, value);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  const remind = state?.kind === "open" ? deadlineReminderText(title, guestUrl, state.date, state.daysLeft) : null;

  return (
    <div className="mt-5 border-t border-border pt-5">
      <p className="flex items-center gap-2 font-black">
        <AlarmClock className="size-5" aria-hidden />
        回答の締め切り
      </p>
      <p className="mt-1 text-xs text-muted">
        {state ? `いまは${state.text}。` : ""}みんなの画面に残りの日数が出ます。過ぎても答えられます
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="回答の締め切り">
        {choices.map((c) => {
          const on = c.value === deadline;
          return (
            <button
              key={c.value ?? "none"}
              type="button"
              disabled={pending}
              aria-pressed={on}
              onClick={() => choose(c.value)}
              className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}
            >
              {on && <Check className="size-3.5" aria-hidden />}
              {c.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      {remind && (
        <div className="mt-4">
          <p className="text-sm font-bold">まだの人に送る</p>
          <p className="mt-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm leading-relaxed break-all whitespace-pre-wrap">{remind}</p>
          <SendButtons mainLabel="共有して締め切りを知らせる" share={{ text: remind }} copy={remind} copyLabel="文をコピー" canShare={canShare} />
        </div>
      )}
    </div>
  );
}
