"use client";

import { Check, ClipboardCopy, FileText, Lock, Table } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { buyStatement } from "@/app/actions";
import { yen } from "@/lib/sendai";
import { BUTTON_PRIMARY } from "./ui";

// 経費精算の名簿と金額を買う前の画面。何ができるかと値段を見せ、Stripe のお会計のページへ進む。
// 見返りのある販売なので、特定商取引法の表示へのリンクを必ず置く

const FEATURES = [
  { icon: ClipboardCopy, text: "精算システムの「内容」「参加者」欄に、そのまま貼れる文" },
  { icon: Table, text: "Excel に貼るとそのまま表になる、名簿と金額" },
  { icon: FileText, text: "会社に出せる精算明細書(PDF)と CSV" },
];

export function StatementPaywall({ collectionId, token, title, price }: { collectionId: string; token: string; title: string; price: number }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function buy() {
    setError(null);
    start(async () => {
      const r = await buyStatement(collectionId, token);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      window.location.href = r.url;
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-16">
      <p className="flex items-center gap-2 text-sm font-bold text-muted">
        <Lock className="size-4" aria-hidden />
        経費精算
      </p>
      <h1 className="mt-1 text-[22px] font-black tracking-tight">名簿と金額を、そのまま貼る</h1>
      <p className="mt-1 text-sm text-muted">{title ? `「${title}」の` : ""}会計を、会社の精算にそのまま使える形に</p>

      <section className="mt-5 rounded-3xl border border-accent/50 bg-accent/5 px-5 py-6">
        <ul className="space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-baseline justify-center gap-1">
          <span className="text-3xl font-black tabular-nums">{yen(price)}</span>
          <span className="text-sm text-muted">(税込)・この会計1回分</span>
        </p>
        <button type="button" onClick={buy} disabled={pending} className={`${BUTTON_PRIMARY} mt-4 w-full gap-2`}>
          {pending ? "お会計のページを開いています…" : `${yen(price)}で使う`}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-center text-sm font-bold text-danger">
            {error}
          </p>
        )}
        <ul className="mt-4 space-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <Check className="size-3.5 shrink-0" aria-hidden />
            お支払いは Stripe のページで。カードの番号は Date に届かない仕組み
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="size-3.5 shrink-0" aria-hidden />
            購入後は、この会計の名簿をいつでも閲覧可能
          </li>
        </ul>
      </section>
      <p className="mt-4 text-center text-xs">
        <Link href="/legal" className="text-muted underline underline-offset-2">
          特定商取引法に基づく表記
        </Link>
      </p>
    </div>
  );
}
