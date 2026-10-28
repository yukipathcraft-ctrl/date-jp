import { CalendarDays, ChevronDown, Cigarette, Clock, MapPin, MessageSquareText, Moon, UtensilsCrossed, Users, Wallet, Wine } from "lucide-react";
import { areaLabel, budgetLabel, clock, dateLabel, stayLabel } from "@/lib/sendai";
import type { Summary } from "@/lib/summary";
import { WhoCanGo } from "./WhoCanGo";

// みんなの回答から決まったこと。予算は「全員が出せる額」だけを出し、誰がいくらと答えたかは出さない

/** みんなのひとこと。書いた人がいなければ出さない */
function Notes({ notes }: { notes: Summary["notes"] }) {
  if (notes.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl border border-border px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-bold">
        <MessageSquareText className="size-4" aria-hidden />
        みんなのひとこと
      </p>
      <ul className="mt-2 space-y-2">
        {notes.map((n) => (
          <li key={n.name} className="text-sm">
            <span className="font-bold">{n.name}</span>
            <span className="ml-2 whitespace-pre-wrap break-words text-text/90">{n.memo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 行く人の苦手なものと、お酒を飲まない人の数。誰が選んだかは出さない */
function Diet({ diet }: { diet: Summary["diet"] }) {
  if (diet.avoids.length === 0 && diet.nonDrinkers === 0 && diet.smokers === 0 && diet.others.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl border border-border px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-bold">
        <UtensilsCrossed className="size-4" aria-hidden />
        お店を選ぶときに気をつけること
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {diet.nonDrinkers > 0 && (
          <li className="tier-purple inline-flex items-center gap-1 rounded-full bg-[var(--ts)] px-2.5 py-1 text-xs font-bold text-[var(--tc)]">
            <Wine className="size-3.5" aria-hidden />
            お酒を飲まない人 {diet.nonDrinkers}人
          </li>
        )}
        {diet.smokers > 0 && (
          <li className="tier-gray inline-flex items-center gap-1 rounded-full bg-[var(--ts)] px-2.5 py-1 text-xs font-bold text-[var(--tc)]">
            <Cigarette className="size-3.5" aria-hidden />
            タバコを吸う人 {diet.smokers}人
          </li>
        )}
        {diet.avoids.map((a) => (
          <li key={a.key} className="tier-red inline-flex items-center rounded-full bg-[var(--ts)] px-2.5 py-1 text-xs font-bold text-[var(--tc)]">
            {a.label}が苦手 {a.count}人
          </li>
        ))}
        {diet.others.map((t) => (
          <li key={t} className="tier-red inline-flex items-center rounded-full bg-[var(--ts)] px-2.5 py-1 text-xs font-bold text-[var(--tc)]">
            {t}が苦手
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">誰が選んだか・書いたかは出していません。予約のときにお店に伝えましょう</p>
    </div>
  );
}

export function SummaryView({ summary }: { summary: Summary }) {
  if (summary.answered === 0) {
    return (
      <section className="mx-4 rounded-3xl border panel px-4 py-6">
        <h2 className="text-lg font-black">みんなの答え</h2>
        <p className="mt-2 text-sm text-muted">まだ誰も答えていません</p>
      </section>
    );
  }
  if (summary.date === null) {
    return (
      <section className="mx-4 rounded-3xl border panel px-4 py-6">
        <h2 className="text-lg font-black">みんなの答え({summary.answered}人)</h2>
        <p className="mt-2 text-sm text-muted">どの日も全員が行けないと答えているので、候補の日を足して作り直してください</p>
        <WhoCanGo summary={summary} />
        <Notes notes={summary.notes} />
      </section>
    );
  }

  // いつも出すのは、日にち・時間・予算の3つだけ。場所と二次会は「くわしく」の中に入れる
  const rows = [
    { icon: CalendarDays, label: "日にち", value: dateLabel(summary.date), sub: `${summary.attendees.length}人が行けます` },
    {
      icon: Clock,
      label: "時間",
      value: `${clock(summary.start!)}〜${clock(summary.firstEnd!)}`,
      sub: summary.lateJoiners.length > 0 ? `${summary.lateJoiners.join("と")}さんは途中から来ます` : "全員そろって始められます",
    },
    { icon: Wallet, label: "予算", value: budgetLabel(summary.budget!), sub: "行く人全員が出せる額です" },
  ];
  const more = [
    {
      icon: MapPin,
      label: "場所",
      value: summary.area ? areaLabel(summary.area) : "どこでもOK",
      sub: summary.area ? summary.areaVotes.map((v) => `${areaLabel(v.key)} ${v.votes}`).join(" / ") : "全員どこでもいいと答えています",
    },
    {
      icon: Moon,
      label: "二次会",
      value: `${summary.secondParty.length}人`,
      sub: summary.secondParty.length > 0 ? `${summary.secondParty.join("と")}さんが残れます` : "一次会で解散になりそうです",
    },
  ];

  return (
    <section className="mx-4 rounded-3xl border panel px-4 py-6">
      <h2 className="text-lg font-black">みんなの答えで決まったこと</h2>
      <p className="mt-1 text-sm text-muted">{summary.answered}人が回答</p>
      {/* 日にちを決めるのに大事なので、決まったことの前に出す */}
      <WhoCanGo summary={summary} />
      <dl className="mt-4 divide-y divide-border rounded-2xl border border-border">
        {rows.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="flex items-start gap-3 px-4 py-3">
            <Icon className="mt-1 size-5 shrink-0" aria-hidden />
            <dt className="w-14 shrink-0 pt-0.5 text-sm font-bold text-muted">{label}</dt>
            <dd className="min-w-0">
              <span className="block text-lg font-black">{value}</span>
              <span className="block text-xs text-muted">{sub}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* 場所・二次会・苦手なもの・ひとこと・何時まで残れるかは、たたんでおく */}
      <details className="group mt-3 rounded-2xl bg-surface-2 px-4 py-3">
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
          <Users className="size-4" aria-hidden />
          <span className="flex-1">くわしく見る(場所・二次会・苦手なもの・ひとこと)</span>
          <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <dl className="mt-2 divide-y divide-border rounded-2xl border border-border">
          {more.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="flex items-start gap-3 px-4 py-3">
              <Icon className="mt-1 size-5 shrink-0" aria-hidden />
              <dt className="w-14 shrink-0 pt-0.5 text-sm font-bold text-muted">{label}</dt>
              <dd className="min-w-0">
                <span className="block text-lg font-black">{value}</span>
                <span className="block text-xs text-muted">{sub}</span>
              </dd>
            </div>
          ))}
        </dl>
        <Diet diet={summary.diet} />
        <Notes notes={summary.notes} />
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
