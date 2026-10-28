"use client";

import { Download, FileText, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { yen } from "@/lib/sendai";
import { averageYen, statementCsv, statementRows, type StatementMeta } from "@/lib/statement";
import type { Collection } from "@/lib/store/types";
import { BUTTON_PRIMARY, BUTTON_SUB, INPUT } from "./ui";

// 経費精算の明細。左で日にち・お店・用途を入れ、右の白い紙をそのまま印刷(PDF)するか CSV で保存する。
// パソコンでは画面いっぱいに広げ、入力と紙を横に並べる。スマホでは縦に並べる

const metaKey = (id: string) => `nomi:statement:${id}`;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 「2026-10-30」を「2026年10月30日」に */
function jpDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : "";
}

export function StatementView({ collection: c }: { collection: Omit<Collection, "adminHash"> }) {
  const [meta, setMeta] = useState<StatementMeta>({ date: "", shop: "", purpose: "" });
  const [issued, setIssued] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIssued(today());
    try {
      const saved = JSON.parse(localStorage.getItem(metaKey(c.id)) ?? "null") as StatementMeta | null;
      if (saved) setMeta(saved);
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [c.id]);

  function change(key: keyof StatementMeta, value: string) {
    const next = { ...meta, [key]: value };
    setMeta(next);
    try {
      localStorage.setItem(metaKey(c.id), JSON.stringify(next));
    } catch {}
  }

  function downloadCsv() {
    // 表計算ソフトで文字化けしないよう、先頭に BOM を付ける
    const blob = new Blob(["﻿", statementCsv(c, meta)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `精算明細_${c.title || "お会計"}_${meta.date || issued}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const rows = statementRows(c);
  const host = c.people.find((p) => p.organizer);
  const field = "block text-sm font-bold text-white/70";

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-16 lg:grid lg:max-w-none lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-10 lg:px-10 print:max-w-none print:p-0">
      <section className="print:hidden lg:sticky lg:top-24">
        <p className="flex items-center gap-2 text-sm font-bold text-muted">
          <FileText className="size-4" aria-hidden />
          経費精算の明細
        </p>
        <h1 className="mt-1 text-[22px] font-black tracking-tight">会社に出す明細を作る</h1>
        <p className="mt-1 text-sm text-muted">日にちとお店を入れると、明細に入ります。この端末に残るので、あとから開いても入ったままです</p>

        <div className="mt-5 space-y-4">
          <label className={field}>
            利用日
            <input type="date" value={meta.date} onChange={(e) => change("date", e.target.value)} className={`${INPUT} mt-2 [color-scheme:dark]`} />
          </label>
          <label className={field}>
            店名
            <input value={meta.shop} maxLength={40} onChange={(e) => change("shop", e.target.value)} placeholder="例: 居酒屋 伊達 国分町店" className={`${INPUT} mt-2`} />
          </label>
          <label className={field}>
            用途
            <input value={meta.purpose} maxLength={40} onChange={(e) => change("purpose", e.target.value)} placeholder="例: 新入社員歓迎会" className={`${INPUT} mt-2`} />
          </label>
        </div>

        <div className="mt-6 grid gap-3">
          <button type="button" onClick={() => window.print()} className={`${BUTTON_PRIMARY} gap-2`}>
            <Printer className="size-5" aria-hidden />
            印刷・PDFで保存
          </button>
          <button type="button" onClick={downloadCsv} className={`${BUTTON_SUB} gap-2`}>
            <Download className="size-5" aria-hidden />
            CSV(Excel)で保存
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">PDFにするときは、印刷の画面で「PDFに保存」を選んでください。お店の領収書は別に添えてください</p>
      </section>

      {/* 紙の明細。印刷しても同じに見えるよう、白地に黒い字で固定する */}
      <article className="mt-8 rounded-lg bg-white px-6 py-8 text-[#111] shadow-2xl sm:px-10 lg:mt-0 print:mt-0 print:rounded-none print:px-0 print:py-0 print:shadow-none">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#111] pb-3">
          <h2 className="text-2xl font-black tracking-[0.3em]">精算明細書</h2>
          <p className="text-xs text-[#555]">発行日 {jpDate(issued)}</p>
        </div>

        <dl className="mt-6 grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
          <dt className="text-[#555]">件名</dt>
          <dd className="font-bold">{c.title || "お会計"}</dd>
          <dt className="text-[#555]">利用日</dt>
          <dd>{jpDate(meta.date) || "—"}</dd>
          <dt className="text-[#555]">店名</dt>
          <dd>{meta.shop || "—"}</dd>
          <dt className="text-[#555]">用途</dt>
          <dd>{meta.purpose || "—"}</dd>
          <dt className="text-[#555]">精算者</dt>
          <dd>{host ? `${host.name}(幹事・立替)` : "—"}</dd>
        </dl>

        <div className="mt-6 grid grid-cols-3 border border-[#111] text-center">
          <div className="border-r border-[#111] px-2 py-3">
            <p className="text-xs text-[#555]">合計金額</p>
            <p className="mt-1 text-lg font-black tabular-nums sm:text-xl">{yen(c.total)}</p>
          </div>
          <div className="border-r border-[#111] px-2 py-3">
            <p className="text-xs text-[#555]">人数</p>
            <p className="mt-1 text-lg font-black tabular-nums sm:text-xl">{c.people.length}人</p>
          </div>
          <div className="px-2 py-3">
            <p className="text-xs text-[#555]">1人あたり平均</p>
            <p className="mt-1 text-lg font-black tabular-nums sm:text-xl">{yen(averageYen(c))}</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <thead>
              <tr className="border-y border-[#111] bg-[#f2f2f2] text-left">
                <th className="w-10 px-2 py-2 font-bold">No</th>
                <th className="px-2 py-2 font-bold">氏名</th>
                <th className="px-2 py-2 font-bold">区分</th>
                <th className="px-2 py-2 text-right font-bold">負担額</th>
                <th className="px-2 py-2 font-bold">支払い状況</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.no} className="border-b border-[#ccc]">
                  <td className="px-2 py-2 tabular-nums">{r.no}</td>
                  <td className="px-2 py-2">{r.name}</td>
                  <td className="px-2 py-2">{r.label}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{yen(r.amount)}</td>
                  <td className="px-2 py-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-b-2 border-[#111] font-black">
                <td className="px-2 py-2" colSpan={3}>
                  合計
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{yen(rows.reduce((s, r) => s + r.amount, 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-8 text-right text-[10px] text-[#888]">Date(date-sendai.vercel.app)で作成</p>
      </article>
    </div>
  );
}
