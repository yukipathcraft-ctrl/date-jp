import { describe, expect, it } from "vitest";
import { EMPTY_META, attendeeLine, averageYen, expenseSummary, paymentStatus, rosterTsv, statementCsv, statementRows } from "./statement";
import type { CollectionPerson } from "./store/types";

const person = (id: number, name: string, amount: number, organizer = false): CollectionPerson => ({
  id,
  name,
  label: "×1.0",
  mark: "",
  tone: "gray",
  amount,
  organizer,
});

const c = {
  id: "ab12cd34ef",
  title: "部署の歓迎会",
  total: 10000,
  people: [person(1, "山田", 4000, true), person(2, "佐藤", 3000), person(3, "鈴木", 3000)],
  payments: { 2: { by: "host" as const } },
};

describe("statement", () => {
  it("幹事は立替、受け取りを記録した人は受取済み、まだの人は未払い", () => {
    expect(paymentStatus(c, 1)).toBe("立替(幹事)");
    expect(paymentStatus(c, 2)).toBe("受取済み");
    expect(paymentStatus(c, 3)).toBe("未払い");
    expect(paymentStatus({ ...c, payments: { 3: { by: "self" } } }, 3)).toBe("支払済み(本人申告)");
  });

  it("行には番号を振り、幹事の区分は「幹事」にする", () => {
    const rows = statementRows(c);
    expect(rows.map((r) => r.no)).toEqual([1, 2, 3]);
    expect(rows[0].label).toBe("幹事");
    expect(rows[1]).toMatchObject({ name: "佐藤", amount: 3000 });
  });

  it("1人あたりは四捨五入する", () => {
    expect(averageYen(c)).toBe(3333);
    expect(averageYen({ ...c, people: [] })).toBe(0);
  });

  it("CSV は CRLF で区切り、カンマや引用符を含む値は囲む", () => {
    const csv = statementCsv({ ...c, title: '新人"A",歓迎' }, { ...EMPTY_META, to: "株式会社A, 総務部", date: "2026-10-30", shop: "居酒屋 伊達", purpose: "歓迎会" });
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("精算明細書,No. AB12CD34EF");
    expect(lines).toContain('提出先,"株式会社A, 総務部"');
    expect(lines).toContain('件名,"新人""A"",歓迎"');
    expect(lines).toContain("精算金額(税込),10000");
    expect(lines).toContain("No,氏名,所属・関係,区分,負担額,集金状況");
    expect(lines).toContain("1,山田,,幹事,4000,立替(幹事)");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("参加者欄の1行は、所属があればかっこで添え、最後に人数を付ける", () => {
    expect(attendeeLine(c)).toBe("山田、佐藤、鈴木 計3名");
    expect(attendeeLine(c, { 2: "株式会社A", 3: " " })).toBe("山田、佐藤(株式会社A)、鈴木 計3名");
  });

  it("Excel に貼る表はタブ区切りで、合計の行が付き、値の中のタブや改行は空白にする", () => {
    const lines = rosterTsv(c, { 1: "営業\t部" }).split("\n");
    expect(lines[0]).toBe("No\t氏名\t所属・関係\t負担額");
    expect(lines[1]).toBe("1\t山田\t営業 部\t4000");
    expect(lines.at(-1)).toBe("\t合計\t3名\t10000");
  });

  it("まとめて貼る文は空の項目を出さず、目的がなければ件名を使う", () => {
    const text = expenseSummary(c, { ...EMPTY_META, date: "2026-10-30", shop: "居酒屋 伊達" });
    expect(text).toBe(
      ["利用日: 2026/10/30", "支払先: 居酒屋 伊達", "目的: 部署の歓迎会", "金額: 10,000円(税込)", "人数: 3名(1人あたり 3,333円)", "参加者: 山田、佐藤、鈴木 計3名"].join("\n"),
    );
  });
});
