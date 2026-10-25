import { CalendarDays, Clock, MapPin, Moon, Users, Wallet } from "lucide-react";
import { areaLabel, clock, dateLabel, stayLabel, yen } from "@/lib/sendai";
import type { Summary } from "@/lib/summary";

// みんなの回答から決まったこと。予算は「全員が出せる額」だけを出し、誰がいくらと答えたかは出さない

export function SummaryView({ summary }: { summary: Summary }) {
  if (summary.answered === 0) {
    return (
      <section className="mx-4 rounded-3xl border border-border bg-surface px-4 py-6">
        <h2 className="text-lg font-extrabold">みんなの答え</h2>
        <p className="mt-2 text-sm text-muted">まだ誰も答えていません</p>
      </section>
    );
  }
  if (summary.date === null) {
    return (
      <section className="mx-4 rounded-3xl border border-border bg-surface px-4 py-6">
        <h2 className="text-lg font-extrabold">みんなの答え({summary.answered}人)</h2>
        <p className="mt-2 text-sm text-muted">どの日も全員が行けないと答えているので、候補の日を足して作り直してください</p>
      </section>
    );
  }

  const rows = [
    { icon: CalendarDays, label: "日にち", value: dateLabel(summary.date), sub: `${summary.attendees.length}人が行けます` },
    {
      icon: Clock,
      label: "時間",
      value: `${clock(summary.start!)}〜${clock(summary.firstEnd!)}`,
      sub: summary.lateJoiners.length > 0 ? `${summary.lateJoiners.join("と")}さんは途中から来ます` : "全員そろって始められます",
    },
    { icon: Wallet, label: "予算", value: `${yen(summary.budget!)}まで`, sub: "行く人全員が出せる額です" },
    {
      icon: MapPin,
      label: "場所",
      value: areaLabel(summary.area!),
      sub: summary.areaVotes.map((v) => `${areaLabel(v.key)} ${v.votes}`).join(" / "),
    },
    {
      icon: Moon,
      label: "二次会",
      value: `${summary.secondParty.length}人`,
      sub: summary.secondParty.length > 0 ? `${summary.secondParty.join("と")}さんが残れます` : "一次会で解散になりそうです",
    },
  ];

  return (
    <section className="mx-4 rounded-3xl border border-border bg-surface px-4 py-6">
      <h2 className="text-lg font-extrabold">みんなの答えで決まったこと</h2>
      <p className="mt-1 text-sm text-muted">{summary.answered}人が回答</p>
      <dl className="mt-4 divide-y divide-border rounded-2xl border border-border">
        {rows.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="flex items-start gap-3 px-4 py-3">
            <Icon className="mt-1 size-5 shrink-0" aria-hidden />
            <dt className="w-14 shrink-0 pt-0.5 text-sm font-bold text-muted">{label}</dt>
            <dd className="min-w-0">
              <span className="block text-lg font-extrabold">{value}</span>
              <span className="block text-xs text-muted">{sub}</span>
            </dd>
          </div>
        ))}
      </dl>

      <details className="mt-4 rounded-2xl bg-surface-2 px-4 py-3">
        <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-bold">
          <Users className="size-4" aria-hidden />
          日ごとの人数と、何時まで残れるか
        </summary>
        <ul className="mt-2 space-y-1 text-sm">
          {summary.ranking.map((r) => (
            <li key={r.date} className="flex justify-between">
              <span>
                {dateLabel(r.date)}
                {r.date === summary.date && <span className="ml-2 text-xs font-bold text-match-text">★ この日</span>}
              </span>
              <span>
                ○ {r.ok}人 / △ {r.maybe}人
              </span>
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          {summary.attendees.map((a) => (
            <li key={a.name} className="flex justify-between">
              <span>{a.name}</span>
              <span className="text-muted">
                {clock(a.arrival)}から・{stayLabel(a.stay)}
              </span>
            </li>
          ))}
          {summary.maybes.length > 0 && <li className="text-muted">△ たぶん: {summary.maybes.join("・")}</li>}
        </ul>
      </details>
    </section>
  );
}
