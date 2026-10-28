import { Crown } from "lucide-react";
import { dateLabel } from "@/lib/sendai";
import type { DateAnswer, Summary } from "@/lib/summary";

// 誰がいつ行けるか。調整さんのように、日にち(行)× 人(列)の表で ○ △ × を見せる。
// 人が多いと横にはみ出すので、表だけを横にずらせるようにし、日にちの列は左に止めておく。
// 色だけで見分けさせないよう、必ず ○ △ × の記号を入れる

const MARK: Record<DateAnswer, { sign: string; label: string; cls: string }> = {
  ok: { sign: "○", label: "行ける", cls: "tier-green bg-[var(--ts)] text-[var(--tc)]" },
  maybe: { sign: "△", label: "たぶん", cls: "tier-yellow bg-[var(--ts)] text-[var(--tc)]" },
  no: { sign: "×", label: "無理", cls: "text-white/35" },
};

export function WhoCanGo({ summary }: { summary: Summary }) {
  const { dates, who, ranking, must } = summary;
  if (who.length === 0) return null;
  const count = (d: string) => ranking.find((r) => r.date === d);
  return (
    <div className="mt-4">
      <p className="text-sm font-bold">誰がいつ行けるか</p>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-border">
        <table className="w-max min-w-full border-collapse text-center text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left text-xs font-bold text-muted">日にち</th>
              {who.map((p) => (
                <th key={p.name} scope="col" className="max-w-[4.5rem] px-1.5 py-2 text-xs font-bold">
                  <span className="flex items-center justify-center gap-0.5">
                    {must.includes(p.name) && <Crown className="size-3 shrink-0 text-accent" aria-label="必ず来てほしい人" />}
                    <span className="truncate">{p.name}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((d) => {
              const r = count(d);
              const best = d === summary.date;
              return (
                <tr key={d} className={`border-b border-border last:border-b-0 ${best ? "bg-accent/10" : ""}`}>
                  <th scope="row" className={`sticky left-0 z-10 px-3 py-2 text-left whitespace-nowrap ${best ? "bg-[#2a2310]" : "bg-surface"}`}>
                    <span className="block text-sm font-black">
                      {dateLabel(d)}
                      {best && <span className="ml-1 text-xs text-accent">★</span>}
                    </span>
                    <span className="block text-[11px] font-normal text-muted">
                      ○{r?.ok ?? 0} △{r?.maybe ?? 0}
                    </span>
                  </th>
                  {who.map((p) => {
                    const m = MARK[p.dates[d] ?? "no"];
                    return (
                      <td key={p.name} className="px-1 py-1.5">
                        <span
                          className={`mx-auto grid size-8 place-items-center rounded-lg text-base font-black ${m.cls}`}
                          title={`${p.name}: ${m.label}`}
                        >
                          <span aria-hidden>{m.sign}</span>
                          <span className="sr-only">
                            {p.name}は{m.label}
                          </span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        ○ 行ける ・ △ たぶん ・ × 無理{summary.date ? " ・ ★ いちばん行ける人が多い日" : ""}
        {must.length > 0 ? " ・ 冠は必ず来てほしい人" : ""}
      </p>
    </div>
  );
}
