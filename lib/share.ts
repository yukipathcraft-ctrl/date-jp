import { clock, dateLabel } from "./sendai";

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
