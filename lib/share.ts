import type { Audience } from "./audience";
import { clock, dateLabel, yen } from "./sendai";

/** LINE の送り先選びを開く URL */
export function lineShareUrl(text: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

/**
 * 送る文の最後に添える一言。受け取った人が Date を知り、次の会で自分も使えるようにする
 */
export const MADE_WITH = "仙台の飲み会を決めるアプリ「Date」で作りました";

export function inviteText(title: string, url: string): string {
  return [
    `「${title}」の日にちとお店を決めたいので、行ける日と予算と何時まで残れるかを入れてください(30秒で終わります)`,
    url,
    "",
    MADE_WITH,
  ].join("\n");
}

/**
 * 会計の催促の文。まだ払っていない人の名前と金額を並べる。学生と社会人で言い方を変える
 * (責める言い方にしない。誰が払ったかは書かず、まだの人だけを書く)
 */
export function reminderText(
  audience: Audience,
  title: string,
  unpaid: { name: string; amount: number }[],
): string {
  const what = title.trim() ? `「${title.trim()}」` : audience === "student" ? "この前の飲み会" : "先日の会";
  const lead =
    audience === "student"
      ? [`${what}のお会計、まだの人は幹事までお願いします!`]
      : ["お疲れさまです。", `${what}のお会計がまだの方は、幹事までお願いいたします。`];
  return [
    ...lead,
    "",
    ...unpaid.map((u) => `・${u.name}さん ${yen(u.amount)}`),
    "",
    audience === "student" ? "もう払った人は気にしないでね" : "行き違いでお支払い済みの場合は、ご容赦ください。",
  ].join("\n");
}

export function decidedText(title: string, date: string, start: number, shopName: string | null, url: string): string {
  return [
    `「${title}」が決まりました!`,
    `${dateLabel(date)} ${clock(start)}から${shopName ? `、${shopName}` : ""}`,
    "詳しくはこちら",
    url,
    "",
    MADE_WITH,
  ].join("\n");
}
