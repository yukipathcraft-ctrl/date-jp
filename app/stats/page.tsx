import { timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SiteHeader } from "@/components/SiteHeader";
import { cleanEnv } from "@/lib/env";
import { findShop } from "@/lib/shops";
import { getStore } from "@/lib/store";

// 使われ方の画面。作った本人だけが見る。STATS_TOKEN と同じ token を付けて開く。
// 数えるのは件数だけで、誰が何をしたかは出さない

export const metadata: Metadata = { title: "使われ方", robots: { index: false, follow: false } };

/** アフィリエイトを始める目安。月にこれだけお店が押されたら、紹介料でサーバー代をまかなえる */
const AFFILIATE_SIGNAL = 60;
/** 1回の会で入る紹介料の見込み(100円 × ホットペッパーで予約 40% × 来店 90%) */
const YEN_PER_DECIDED_PARTY = 36;

function allowed(token: unknown): boolean {
  const expected = cleanEnv(process.env.STATS_TOKEN);
  if (!expected || typeof token !== "string") return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 日本時間で今月の1日 0時 */
function monthStart(now: Date): Date {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), 1) - 9 * 60 * 60 * 1000);
}

export default async function StatsPage(props: PageProps<"/stats">) {
  await connection();
  const { token } = await props.searchParams;
  // 鍵が合わなければ、画面があること自体を見せない
  if (!allowed(token)) notFound();

  const now = new Date();
  const stats = await getStore().getStats(monthStart(now));
  const shops = await Promise.all(
    stats.topShops.map(async (s) => ({ ...s, name: (await findShop(s.shopId))?.name ?? s.shopId })),
  );
  const month = now.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "long" });
  const left = Math.max(0, AFFILIATE_SIGNAL - stats.clicks);
  const tiles = [
    { label: "作られた会", value: stats.parties, note: `これまでに${stats.totalParties}回` },
    { label: "日にちまで決まった会", value: stats.decided, note: stats.parties > 0 ? `作られた会の${Math.round((stats.decided / stats.parties) * 100)}%` : "まだありません" },
    { label: "集まった回答", value: stats.answers, note: stats.parties > 0 ? `1回の会に平均${(stats.answers / stats.parties).toFixed(1)}人` : "まだありません" },
    { label: "お店が押された数", value: stats.clicks, note: `これまでに${stats.totalClicks}回` },
  ];

  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 pt-6 pb-16">
        <p className="text-sm font-bold text-muted">自分だけが見る画面です</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{month}の使われ方</h1>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-3xl border border-border bg-surface px-4 py-4">
              <p className="text-xs font-bold text-muted">{t.label}</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums">{t.value.toLocaleString("ja-JP")}</p>
              <p className="mt-0.5 text-[11px] text-muted">{t.note}</p>
            </div>
          ))}
        </div>

        <section className="mt-4 rounded-3xl border border-accent/40 bg-surface px-5 py-5">
          <h2 className="font-extrabold">アフィリエイトを始める目安</h2>
          <p className="mt-1 text-sm text-muted">
            お店が月に{AFFILIATE_SIGNAL}回押されるようになったら、紹介料でサーバー代をまかなえるくらいになります
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (stats.clicks / AFFILIATE_SIGNAL) * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm font-bold">
            {left === 0 ? "目安に届きました。始める準備をしてよさそうです" : `今月はあと${left}回で目安に届きます`}
          </p>
          <p className="mt-3 text-xs text-muted">
            今月の会が全部アフィリエイトのリンクを通っていたら、紹介料はおよそ
            {(stats.decided * YEN_PER_DECIDED_PARTY).toLocaleString("ja-JP")}円になっていた見込みです(決まった会 × {YEN_PER_DECIDED_PARTY}円で計算)
          </p>
        </section>

        <h2 className="mt-9 mb-3 px-1 text-sm font-bold text-muted">今月よく押されたお店</h2>
        <section className="overflow-hidden rounded-3xl border border-border bg-surface">
          {shops.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted">今月はまだお店が押されていません</p>
          ) : (
            <ol>
              {shops.map((s, i) => (
                <li key={s.shopId} className="flex min-h-14 items-center gap-3 border-t border-border px-5 first:border-t-0">
                  <span className="w-5 shrink-0 text-sm font-extrabold text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">{s.name}</span>
                  <span className="shrink-0 font-extrabold tabular-nums">{s.count}回</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
