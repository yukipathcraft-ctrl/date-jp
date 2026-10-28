import type { Collection } from "./store/types";

// 経費精算に出す明細。集金のページの中身から、表の行と CSV を作る。純粋関数

/** 幹事が明細に書き足す項目。集金のページには日にちとお店を残していないので、ここで入れてもらう */
export type StatementMeta = {
  /** 提出先(会社名・部署) */
  to: string;
  /** 申請者の所属と氏名 */
  dept: string;
  applicant: string;
  date: string;
  shop: string;
  purpose: string;
  note: string;
};

export const EMPTY_META: StatementMeta = { to: "", dept: "", applicant: "", date: "", shop: "", purpose: "", note: "" };

/** 明細書の番号。集金のページの id から作るので、同じ会なら何度作っても同じ番号になる */
export function statementNo(id: string): string {
  return `No. ${id.toUpperCase()}`;
}

export type StatementRow = { no: number; name: string; label: string; amount: number; status: string };

type Source = Pick<Collection, "total" | "people" | "payments">;

/** 支払いの状況。幹事は立て替えた人なので「立替」、本人が押しただけのものは「申告済み」と分ける */
export function paymentStatus(c: Source, personId: number): string {
  const p = c.people.find((x) => x.id === personId);
  if (p?.organizer) return "立替(幹事)";
  const pay = c.payments[personId];
  if (!pay) return "未払い";
  return pay.by === "host" ? "受取済み" : "支払済み(本人申告)";
}

export function statementRows(c: Source): StatementRow[] {
  return c.people.map((p, i) => ({
    no: i + 1,
    name: p.name,
    label: p.organizer ? "幹事" : p.label,
    amount: p.amount,
    status: paymentStatus(c, p.id),
  }));
}

/** 1人あたりの平均(円未満は四捨五入) */
export function averageYen(c: Source): number {
  return c.people.length ? Math.round(c.total / c.people.length) : 0;
}

function cell(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 表計算ソフトで開ける CSV。上に会の情報、下に1人ずつの行を置く(改行は CRLF) */
export function statementCsv(c: Source & { id: string; title: string }, meta: StatementMeta): string {
  const lines: (string | number)[][] = [
    ["精算明細書", statementNo(c.id)],
    ["提出先", meta.to],
    ["所属", meta.dept],
    ["申請者", meta.applicant],
    ["件名", c.title || "お会計"],
    ["利用日", meta.date],
    ["支払先", meta.shop],
    ["用途・目的", meta.purpose],
    ["精算金額(税込)", c.total],
    ["人数", c.people.length],
    ["1人あたり平均", averageYen(c)],
    ["備考", meta.note],
    [],
    ["No", "氏名", "区分", "負担額", "集金状況"],
    ...statementRows(c).map((r) => [r.no, r.name, r.label, r.amount, r.status]),
  ];
  return lines.map((l) => l.map(cell).join(",")).join("\r\n") + "\r\n";
}
