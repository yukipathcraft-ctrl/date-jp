"use client";

import { Check, ClipboardCopy, Download, FileText, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { yen } from "@/lib/sendai";
import {
  EMPTY_META,
  attendeeLine,
  averageYen,
  expenseSummary,
  rosterTsv,
  statementCsv,
  statementNo,
  statementRows,
  type MetaTextKey,
  type StatementMeta,
} from "@/lib/statement";
import type { Collection } from "@/lib/store/types";
import { BUTTON_PRIMARY, BUTTON_SUB, INPUT } from "./ui";

// 経費精算に使う名簿と金額。会社の精算システムや Excel に「コピーして貼るだけ」を主にし、
// 決まった書類を出す会社のために、精算明細書(印刷・PDF)と CSV も付ける。
// パソコンでは画面いっぱいに広げ、入力と貼るものを横に並べる。スマホでは縦に並べる

const metaKey = (id: string) => `nomi:statement:${id}`;

type Field = { key: MetaTextKey; label: string; placeholder?: string; type?: string };

/** 会の情報。貼る文にも書類にも入る */
const EVENT_FIELDS: Field[] = [
  { key: "date", label: "利用日", type: "date" },
  { key: "shop", label: "支払先(店名)", placeholder: "例: 居酒屋 伊達 国分町店" },
  { key: "address", label: "店の所在地", placeholder: "例: 仙台市青葉区国分町2-1-1" },
  { key: "purpose", label: "目的", placeholder: "例: 新入社員歓迎会" },
];

/** 書類で出すときだけ使う項目 */
const DOC_FIELDS: Field[] = [
  { key: "to", label: "提出先(会社名・部署)", placeholder: "例: 株式会社〇〇 総務部" },
  { key: "dept", label: "あなたの所属", placeholder: "例: 営業部 第一課" },
  { key: "applicant", label: "申請者(あなたの名前)", placeholder: "例: 山田 太郎" },
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

/** コピーして貼るもの1つ。何に貼るかと中身を見せ、押すとコピーして ✓ を出す */
function PasteCard({ step, title, where, text, preview }: { step: number; title: string; where: string; text: string; preview?: React.ReactNode }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {}
  }
  return (
    <section className="rounded-3xl border panel px-5 py-5">
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-accent-text">{step}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-black">{title}</h3>
          <p className="text-xs text-muted">{where}</p>
        </div>
      </div>
      <div className="mt-3 max-h-60 overflow-auto rounded-2xl bg-surface-2 px-4 py-3 text-sm leading-relaxed break-all whitespace-pre-wrap">
        {preview ?? text}
      </div>
      <button type="button" onClick={copy} className={`${done ? BUTTON_SUB : BUTTON_PRIMARY} mt-3 w-full gap-2`} aria-live="polite">
        {done ? <Check className="size-5 text-accent" aria-hidden /> : <ClipboardCopy className="size-5" aria-hidden />}
        {done ? "コピーしました。貼ってください" : "コピーする"}
      </button>
    </section>
  );
}

export function StatementView({ collection: c }: { collection: Omit<Collection, "adminHash"> }) {
  const host = c.people.find((p) => p.organizer);
  const [meta, setMeta] = useState<StatementMeta>(EMPTY_META);
  const [issued, setIssued] = useState("");
  /** 書類(精算明細書)を開いているか。閉じているときは画面に紙を出さない(印刷では必ず出す) */
  const [docOpen, setDocOpen] = useState(false);

  useEffect(() => {
    setIssued(today());
    let saved: Partial<StatementMeta> | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(metaKey(c.id)) ?? "null");
    } catch {}
    // 申請者は、はじめは幹事の名前にしておく
    setMeta({ ...EMPTY_META, applicant: host?.name ?? "", ...saved, affiliations: { ...saved?.affiliations } });
  }, [c.id, host?.name]);

  function save(next: StatementMeta) {
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
    a.download = `経費精算_${c.title || "お会計"}_${meta.date || issued}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const rows = statementRows(c, meta.affiliations);
  const blank = <span className="text-[#aaa]">(未記入)</span>;
  const input = (f: Field) => (
    <label key={f.key} className="block text-sm font-bold text-white/70">
      {f.label}
      <input
        type={f.type ?? "text"}
        value={meta[f.key]}
        maxLength={60}
        placeholder={f.placeholder}
        onChange={(e) => save({ ...meta, [f.key]: e.target.value })}
        className={`${INPUT} mt-1.5 min-h-12 ${f.type === "date" ? "[color-scheme:dark]" : ""}`}
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-16 lg:grid lg:max-w-none lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-10 lg:px-10 print:max-w-none print:p-0">
      <section className="print:hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
        <p className="flex items-center gap-2 text-sm font-bold text-muted">
          <FileText className="size-4" aria-hidden />
          経費精算
        </p>
        <h1 className="mt-1 text-[22px] font-black tracking-tight">名簿と金額を、そのまま貼る</h1>
        <p className="mt-1 text-sm text-muted">会社の精算システムや Excel に、コピーして貼るだけで使えます。入れたものはこの端末に残ります</p>

        <h2 className="mt-6 text-sm font-black">会の情報</h2>
        <div className="mt-2 space-y-3">{EVENT_FIELDS.map(input)}</div>

        <h2 className="mt-6 text-sm font-black">参加者の所属・関係(なくても大丈夫)</h2>
        <p className="mt-1 text-xs text-muted">取引先との会食では、相手の会社名を入れておくと、税金の決まりで残す「参加者の関係」になります</p>
        <ul className="mt-2 space-y-2">
          {c.people.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="w-20 shrink-0 truncate text-sm font-bold">{p.name}</span>
              <input
                value={meta.affiliations[p.id] ?? ""}
                maxLength={30}
                placeholder="例: 自社 営業部"
                aria-label={`${p.name}さんの所属・関係`}
                onChange={(e) => save({ ...meta, affiliations: { ...meta.affiliations, [p.id]: e.target.value } })}
                className={`${INPUT} min-h-11 text-sm`}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 space-y-4 lg:mt-0">
        <div className="space-y-4 print:hidden">
          <PasteCard
            step={1}
            title="内容をまとめて"
            where="精算システムの「内容」「備考」欄に貼る"
            text={expenseSummary(c, meta)}
          />
          <PasteCard step={2} title="参加者の名前" where="精算システムの「参加者」「同席者」欄に貼る" text={attendeeLine(c, meta.affiliations)} />
          <PasteCard
            step={3}
            title="名簿と金額の表"
            where="Excel やスプレッドシートに貼ると、そのまま表になります"
            text={rosterTsv(c, meta.affiliations)}
            preview={
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="text-muted">
                  <tr>
                    <th className="py-1 pr-3 font-bold">No</th>
                    <th className="py-1 pr-3 font-bold">氏名</th>
                    <th className="py-1 pr-3 font-bold">所属・関係</th>
                    <th className="py-1 text-right font-bold">負担額</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.no} className="border-t border-border">
                      <td className="py-1 pr-3 tabular-nums">{r.no}</td>
                      <td className="py-1 pr-3">{r.name}</td>
                      <td className="py-1 pr-3">{r.affiliation}</td>
                      <td className="py-1 text-right tabular-nums">{yen(r.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-bold">
                    <td />
                    <td className="py-1 pr-3">合計</td>
                    <td className="py-1 pr-3">{rows.length}名</td>
                    <td className="py-1 text-right tabular-nums">{yen(c.total)}</td>
                  </tr>
                </tbody>
              </table>
            }
          />
          <button type="button" onClick={downloadCsv} className={`${BUTTON_SUB} w-full gap-2 text-sm`}>
            <Download className="size-4" aria-hidden />
            CSV(Excel)で保存する
          </button>

          {/* 決まった書類を出す会社のために、精算明細書も残す */}
          <details className="group rounded-3xl border panel px-5 py-4" onToggle={(e) => setDocOpen(e.currentTarget.open)}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-black">
              <span className="flex items-center gap-2">
                <Printer className="size-5" aria-hidden />
                書類で出すとき(精算明細書・PDF)
              </span>
              <span className="text-xs font-bold text-muted group-open:hidden">開く</span>
            </summary>
            <p className="mt-2 text-xs text-muted">提出先と申請者を入れると、下の明細書に入ります。PDFにするときは、印刷の画面で「PDFに保存」を選んでください</p>
            <div className="mt-3 space-y-3">{DOC_FIELDS.map(input)}</div>
            <button type="button" onClick={() => window.print()} className={`${BUTTON_PRIMARY} mt-4 w-full gap-2`}>
              <Printer className="size-5" aria-hidden />
              印刷・PDFで保存
            </button>
          </details>
        </div>

        {/* 紙の明細書。A4 の縦に収まる幅にし、印刷しても同じに見えるよう白地に黒い字で固定する */}
        <article className={`${docOpen ? "" : "hidden"} mx-auto w-full max-w-[52rem] rounded-sm bg-white px-5 py-8 text-[13px] leading-relaxed text-[#111] shadow-2xl sm:px-12 sm:py-12 print:block print:max-w-none print:rounded-none print:p-0 print:shadow-none`}>
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
              <Row head="所在地">{meta.address || blank}</Row>
              <Row head="目的">{meta.purpose || blank}</Row>
              <Row head="参加人数">
                {c.people.length}名(1人あたり平均 {yen(averageYen(c))})
              </Row>
              <Row head="立替者">{host ? `${host.name}(幹事)` : blank}</Row>
            </tbody>
          </table>

          <h3 className="mt-8 border-l-4 border-[#111] pl-2 text-sm font-bold">参加者の内訳</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse border border-[#111]">
              <thead>
                <tr className="border-b border-[#111] bg-[#f2f2f2] text-xs">
                  <th className="w-10 border-r border-[#111] px-2 py-2 font-bold">No</th>
                  <th className="border-r border-[#111] px-3 py-2 text-left font-bold">氏名</th>
                  <th className="border-r border-[#111] px-3 py-2 text-left font-bold">所属・関係</th>
                  <th className="border-r border-[#111] px-3 py-2 text-right font-bold">負担額</th>
                  <th className="px-3 py-2 text-left font-bold">集金状況</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.no} className="border-b border-[#bbb]">
                    <td className="border-r border-[#111] px-2 py-1.5 text-center tabular-nums">{r.no}</td>
                    <td className="border-r border-[#111] px-3 py-1.5">{r.name}</td>
                    <td className="border-r border-[#111] px-3 py-1.5">{r.affiliation}</td>
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
    </div>
  );
}
