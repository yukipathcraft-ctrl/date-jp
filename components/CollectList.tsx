"use client";

import { ChevronRight, FileText, ListChecks, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collectionProgress } from "@/app/actions";
import { loadMyCollections, type MyCollection } from "@/lib/myCollections";
import { yen } from "@/lib/sendai";
import { BUTTON_PRIMARY } from "./ui";

// 「集金のチェック」。この端末で作った集金を並べ、誰が何人払ったかを棒で見せる。
// 集金は会計の金額から作るので、新しく始めるときは会計の画面へ送る

type Progress = { payers: number; paid: number; unpaidYen: number };

const STEPS = [
  { title: "会計で金額を出す", note: "傾斜でも割り勘でも、出た金額がそのまま集金の額になります" },
  { title: "集金のページをみんなに送る", note: "共有のボタンで、LINE やチャットに送れます" },
  { title: "払った人が自分で「払った」を押す", note: "誰が払ったかが一目で分かり、まだの人にだけ催促を送れます" },
];

export function CollectList() {
  const [items, setItems] = useState<MyCollection[] | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});

  useEffect(() => {
    const list = loadMyCollections();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(list);
    if (list.length === 0) return;
    collectionProgress(list.map((c) => c.id))
      .then((rows) => setProgress(Object.fromEntries(rows.map((r) => [r.id, r]))))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="px-4">
        <Link href="/split#collect" className={`${BUTTON_PRIMARY} w-full gap-2`}>
          <Wallet className="size-5" aria-hidden />
          会計から集金を始める
        </Link>
      </div>

      {items && items.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 px-5 text-sm font-bold text-muted">あなたの集金</h2>
          <ul className="mx-4 overflow-hidden rounded-3xl border panel">
            {items.map((c, i) => {
              const p = progress[c.id];
              const done = p && p.paid === p.payers;
              return (
                <li key={c.id} className="anim-stagger border-t border-border first:border-t-0" style={{ "--i": i } as React.CSSProperties}>
                  <Link
                    href={`/c/${c.id}?token=${c.token}`}
                    className="flex min-h-20 items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-2/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black">{c.title || "お会計"}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {new Date(c.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}・合計 {yen(c.total)}
                      </span>
                      {p ? (
                        <>
                          <span className="tier-green mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                            <span
                              className="anim-grow block h-full rounded-full bg-[var(--tb)]"
                              style={{ width: `${p.payers ? (p.paid / p.payers) * 100 : 0}%` }}
                            />
                          </span>
                          <span className={`mt-1 block text-xs font-bold ${done ? "tier-green text-[var(--tc)]" : "text-text"}`}>
                            {done ? "✓ 全員そろいました" : `${p.payers}人中${p.paid}人が払いました・あと${yen(p.unpaidYen)}`}
                          </span>
                        </>
                      ) : (
                        <span className="mt-2 block h-1.5 rounded-full bg-surface-2" aria-hidden />
                      )}
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                  </Link>
                  {/* 会社に出す明細書へ、集金のページを通らずに飛べる */}
                  <Link
                    href={`/c/${c.id}/statement?token=${c.token}`}
                    className="flex min-h-11 items-center gap-1.5 border-t border-border px-5 text-xs font-bold text-muted transition-colors hover:bg-surface-2/60 hover:text-text"
                  >
                    <FileText className="size-3.5 text-accent" aria-hidden />
                    経費精算の明細書
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h2 className="mt-8 mb-3 flex items-center gap-2 px-5 text-sm font-bold text-muted">
        <ListChecks className="size-4" aria-hidden />
        集金のしかた
      </h2>
      <ol className="mx-4 overflow-hidden rounded-3xl border panel">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 border-t border-border px-5 py-4 first:border-t-0">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-accent-text" aria-hidden>
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block font-black">{s.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{s.note}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
