import { describe, expect, it } from "vitest";
import { greeting, occasionFromTitle, OCCASIONS, variantCount } from "./greeting";
import { AUDIENCE_ORDER } from "./audience";

describe("occasionFromTitle", () => {
  it("会の名前から場面を見る", () => {
    expect(occasionFromTitle("ゼミの忘年会")).toBe("bonenkai");
    expect(occasionFromTitle("2027 新年会")).toBe("shinnenkai");
    expect(occasionFromTitle("サークル追いコン")).toBe("sobetsu");
    expect(occasionFromTitle("新歓")).toBe("kangei");
    expect(occasionFromTitle("営業部 歓送迎会")).toBe("kansougei");
    expect(occasionFromTitle("学祭の打ち上げ")).toBe("uchiage");
    expect(occasionFromTitle("たかしの誕生日会")).toBe("birthday");
    expect(occasionFromTitle("同期飲み")).toBe("none");
  });
});

describe("greeting", () => {
  it("乾杯は「乾杯!」で終わり、場面の一言が入る", () => {
    const text = greeting({ kind: "kanpai", audience: "student", occasion: "bonenkai", title: "ゼミの忘年会" });
    expect(text.endsWith("乾杯!")).toBe(true);
    expect(text).toContain("今年も一年、おつかれさま!");
  });

  it("会社の会は敬語にする", () => {
    const text = greeting({ kind: "kanpai", audience: "worker", occasion: "none", title: "" });
    expect(text).toContain("いただきます");
  });

  it("別の案は、案の数だけ違う文になり、一周すると最初に戻る", () => {
    for (const audience of AUDIENCE_ORDER) {
      for (const { key } of OCCASIONS) {
        for (const kind of ["kanpai", "shime"] as const) {
          const n = variantCount(kind, audience, key);
          const texts = Array.from({ length: n }, (_, i) => greeting({ kind, audience, occasion: key, title: "飲み会", variant: i }));
          expect(new Set(texts).size).toBe(n);
          expect(greeting({ kind, audience, occasion: key, title: "飲み会", variant: n })).toBe(texts[0]);
          expect(texts.every((t) => !t.includes("{"))).toBe(true);
        }
      }
    }
  });

  it("会の名前がなくても、名前の入る所が空にならない", () => {
    const text = greeting({ kind: "kanpai", audience: "student", occasion: "none", title: " ", variant: 2 });
    expect(text.startsWith("、")).toBe(false);
    expect(text).not.toContain("{title}");
  });
});
