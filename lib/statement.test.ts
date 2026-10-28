import { describe, expect, it } from "vitest";
import { averageYen, paymentStatus, statementCsv, statementRows } from "./statement";
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
    const csv = statementCsv({ ...c, title: '新人"A",歓迎' }, { date: "2026-10-30", shop: "居酒屋 伊達", purpose: "歓迎会" });
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe('件名,"新人""A"",歓迎"');
    expect(lines).toContain("合計金額,10000");
    expect(lines).toContain("No,氏名,区分,負担額,支払い状況");
    expect(lines).toContain("1,山田,幹事,4000,立替(幹事)");
    expect(csv.endsWith("\r\n")).toBe(true);
  });
});
