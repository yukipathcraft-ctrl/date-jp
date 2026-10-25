import { describe, expect, it } from "vitest";
import { canSetPayment, parseCollection } from "./collection";

const person = (name: string, tenths = 10) => ({ name, tenths, label: "ふつう", mark: "●", tone: "yellow" });

describe("parseCollection", () => {
  it("金額をサーバーで計算し直し、幹事に印を付ける", () => {
    const r = parseCollection({
      title: " ゼミの打ち上げ ",
      audience: "student",
      total: 10000,
      unit: 100,
      organizer: 0,
      people: [person("幹事"), person("山田", 15), person("佐藤", 5)],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.title).toBe("ゼミの打ち上げ");
    expect(r.value.people.map((p) => p.amount).reduce((a, b) => a + b, 0)).toBe(10000);
    expect(r.value.people[0].organizer).toBe(true);
    expect(r.value.people[1].amount).toBeGreaterThan(r.value.people[2].amount);
  });
  it("おかしな値は通さない", () => {
    const base = { title: "", audience: "student", total: 10000, unit: 100, organizer: 0, people: [person("a"), person("b")] };
    expect(parseCollection({ ...base, total: 0 }).ok).toBe(false);
    expect(parseCollection({ ...base, unit: 7 }).ok).toBe(false);
    expect(parseCollection({ ...base, organizer: 5 }).ok).toBe(false);
    expect(parseCollection({ ...base, people: [person("a")] }).ok).toBe(false);
    expect(parseCollection({ ...base, people: [person("a"), person("b", 99)] }).ok).toBe(false);
  });
});

describe("canSetPayment", () => {
  it("参加した人は払ったにでき、自分で押したものだけ取り消せる", () => {
    expect(canSetPayment(undefined, true, false)).toBe(true);
    expect(canSetPayment({ by: "self" }, false, false)).toBe(true);
    expect(canSetPayment({ by: "host" }, false, false)).toBe(false);
  });
  it("幹事はいつでも切り替えられる", () => {
    expect(canSetPayment({ by: "host" }, false, true)).toBe(true);
    expect(canSetPayment(undefined, true, true)).toBe(true);
  });
});
