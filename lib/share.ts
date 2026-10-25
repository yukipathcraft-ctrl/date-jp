import { clock, dateLabel } from "./sendai";

/** LINE の送り先選びを開く URL */
export function lineShareUrl(text: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

export function inviteText(title: string, url: string): string {
  return [`「${title}」の日にちとお店を決めます。`, "行ける日・予算・何時まで残れるかを30秒で入れてください。", url].join("\n");
}

export function decidedText(title: string, date: string, start: number, shopName: string | null, url: string): string {
  return [
    `「${title}」が決まりました!`,
    `${dateLabel(date)} ${clock(start)}から${shopName ? `、${shopName}` : ""}`,
    "詳しくはこちら",
    url,
  ].join("\n");
}
