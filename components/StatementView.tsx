"use client";

import { Download, FileText, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { yen } from "@/lib/sendai";
import { EMPTY_META, averageYen, statementCsv, statementNo, statementRows, type StatementMeta } from "@/lib/statement";
import type { Collection } from "@/lib/store/types";
import { BUTTON_PRIMARY, BUTTON_SUB, INPUT } from "./ui";

// 経費精算の明細書。左で提出先・申請者・日にち・お店などを入れ、右の白い紙をそのまま印刷(PDF)するか CSV で保存する。
// 会社にそのまま出せるよう、宛名・申請者・精算金額・内容・参加者の内訳・押印欄を、よくある精算書の並びで置く。
// パソコンでは画面いっぱいに広げ、入力と紙を横に並べる。スマホでは縦に並べる

const metaKey = (id: string) => `nomi:statement:${id}`;

const FIELDS: { key: keyof StatementMeta; label: string; placeholder?: string; type?: string }[] = [
  { key: "to", label: "提出先(会社名・部署)", placeholder: "例: 株式会社〇〇 総務部" },
  { key: "dept", label: "あなたの所属", placeholder: "例: 営業部 第一課" },
  { key: "applicant", label: "申請者(あなたの名前)", placeholder: "例: 山田 太郎" },
  { key: "date", label: "利用日", type: "date" },
  { key: "shop", label: "支払先(店名)", placeholder: "例: 居酒屋 伊達 国分町店" },
  { key: "purpose", label: "用途・目的", placeholder: "例: 新入社員歓迎会" },
  { key: "note", label: "備考", placeholder: "例: 領収書1枚を添付" },
];

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 「2026-10-30」を「2026年10月30日」に */
function jpDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : "";
}

/** 書類の表の1行。項目名は灰色の地にする */
function Row({ head, children }: { head: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-[#111]">
      <th className="w-28 border-r border-[#111] bg-[#f2f2f2] px-3 py-2 text-left text-xs font-bold whitespace-nowrap">{head}</th>
      <td className="px-3 py-2">{children}</td>
    </tr>
  );
}

export function StatementView({ collection: c }: { collection: Omit<Collection, "adminHash"> }) {
  const host = c.people.find((p) => p.organizer);
  const [meta, setMeta] = useState<StatementMeta>(EMPTY_META);
  const [issued, setIssued] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIssued(today());
    let saved: Partial<StatementMeta> | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(metaKey(c.id)) ?? "null");
    } catch {}
    // 申請者は、はじめは幹事の名前にしておく
    setMeta({ ...EMPTY_META, applicant: host?.name ?? "", ...saved });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [c.id, host?.name]);

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
    a.download = `精算明細書_${c.title || "お会計"}_${meta.date || issued}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const rows = statementRows(c);
  const blank = <span className="text-[#aaa]">(未記入)</span>;

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-16 lg:grid lg:max-w-none lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-10 lg:px-10 print:max-w-none print:p-0">
      <section className="print:hidden lg:sticky lg:top-24">
        <p className="flex items-center gap-2 text-sm font-bold text-muted">
          <FileText className="size-4" aria-hidden />
          経費精算の明細書
        </p>
        <h1 className="mt-1 text-[22px] font-black tracking-tight">会社に出す明細書を作る</h1>
        <p className="mt-1 text-sm text-muted">入れたものが、そのまま明細書に入ります。この端末に残るので、あとから開いても入ったままです</p>

        <div className="mt-5 space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-sm font-bold text-white/70">
              {f.label}
              <input
                type={f.type ?? "text"}
                value={meta[f.key]}
                maxLength={40}
                placeholder={f.placeholder}
                onChange={(e) => change(f.key, e.target.value)}
                className={`${INPUT} mt-1.5 min-h-12 ${f.type === "date" ? "[color-scheme:dark]" : ""}`}
              />
            </label>
          ))}
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

      {/* 紙の明細書。A4 の縦に収まる幅にし、印刷しても同じに見えるよう白地に黒い字で固定する */}
      <article className="mx-auto mt-8 w-full max-w-[52rem] rounded-sm bg-white px-5 py-8 text-[13px] leading-relaxed text-[#111] shadow-2xl sm:px-12 sm:py-12 lg:mt-0 print:mt-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <div className="flex justify-end text-xs">
          <div className="text-right">
            <p className="tabular-nums">{statementNo(c.id)}</p>
            <p>発行日 {jpDate(issued)}</p>
          </div>
        </div>

        <h2 className="mt-2 text-center text-2xl font-black tracking-[0.5em]">精算明細書</h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <p className="self-end border-b border-[#111] pb-1 text-base font-bold">
            {meta.to || <span className="font-normal text-[#aaa]">(提出先)</span>}
            <span className="ml-2">御中</span>
          </p>
          <table className="w-full border-collapse border border-[#111] text-xs">
            <tbody>
              <Row head="所属">{meta.dept || blank}</Row>
              <tr>
                <th className="w-28 border-r border-[#111] bg-[#f2f2f2] px-3 py-2 text-left font-bold">申請者</th>
                <td className="px-3 py-2">
                  <span className="flex items-center justify-between gap-2">
                    {meta.applicant || blank}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-[#999] text-[10px] text-[#999]">印</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-8">下記のとおり、立て替えた費用を精算いたします。</p>

        <div className="mt-3 flex items-stretch border-2 border-[#111]">
          <p className="flex items-center bg-[#f2f2f2] px-4 text-sm font-bold whitespace-nowrap">精算金額</p>
          <p className="flex-1 px-4 py-3 text-right text-2xl font-black tabular-nums sm:text-3xl">
            ¥{c.total.toLocaleString("ja-JP")}−<span className="ml-2 text-xs font-normal">(税込)</span>
          </p>
        </div>

        <h3 className="mt-8 border-l-4 border-[#111] pl-2 text-sm font-bold">内容</h3>
        <table className="mt-2 w-full border-collapse border border-[#111]">
          <tbody>
            <Row head="件名">{c.title || "お会計"}</Row>
            <Row head="利用日">{jpDate(meta.date) || blank}</Row>
            <Row head="支払先">{meta.shop || blank}</Row>
            <Row head="用途・目的">{meta.purpose || blank}</Row>
            <Row head="参加人数">
              {c.people.length}名(1人あたり平均 {yen(averageYen(c))})
            </Row>
            <Row head="立替者">{host ? `${host.name}(幹事)` : blank}</Row>
          </tbody>
        </table>

        <h3 className="mt-8 border-l-4 border-[#111] pl-2 text-sm font-bold">参加者の内訳</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse border border-[#111]">
            <thead>
              <tr className="border-b border-[#111] bg-[#f2f2f2] text-xs">
                <th className="w-10 border-r border-[#111] px-2 py-2 font-bold">No</th>
                <th className="border-r border-[#111] px-3 py-2 text-left font-bold">氏名</th>
                <th className="border-r border-[#111] px-3 py-2 text-left font-bold">区分</th>
                <th className="border-r border-[#111] px-3 py-2 text-right font-bold">負担額</th>
                <th className="px-3 py-2 text-left font-bold">集金状況</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.no} className="border-b border-[#bbb]">
                  <td className="border-r border-[#111] px-2 py-1.5 text-center tabular-nums">{r.no}</td>
                  <td className="border-r border-[#111] px-3 py-1.5">{r.name}</td>
                  <td className="border-r border-[#111] px-3 py-1.5">{r.label}</td>
                  <td className="border-r border-[#111] px-3 py-1.5 text-right tabular-nums">{yen(r.amount)}</td>
                  <td className="px-3 py-1.5 text-xs">{r.status}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#111] font-bold">
                <td className="border-r border-[#111] px-3 py-2 text-center" colSpan={3}>
                  合計
                </td>
                <td className="border-r border-[#111] px-3 py-2 text-right tabular-nums">{yen(rows.reduce((s, r) => s + r.amount, 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <h3 className="mt-8 border-l-4 border-[#111] pl-2 text-sm font-bold">備考</h3>
        <p className="mt-2 min-h-14 border border-[#111] px-3 py-2">{meta.note || "領収書を添付します。"}</p>

        {/* 押印欄。会社の決まりに合わせて、承認・確認・申請の3つにする */}
        <div className="mt-8 flex justify-end">
          <table className="border-collapse border border-[#111] text-center text-xs">
            <thead>
              <tr className="bg-[#f2f2f2]">
                {["承認", "確認", "申請"].map((h) => (
                  <th key={h} className="w-20 border border-[#111] py-1 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {[0, 1, 2].map((i) => (
                  <td key={i} className="h-20 border border-[#111]" />
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-right text-[10px] text-[#999]">Date で作成</p>
      </article>
    </div>
  );
}
