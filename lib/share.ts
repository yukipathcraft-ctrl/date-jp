import type { Audience } from "./audience";
import { clock, dateLabel, yen } from "./sendai";

/** LINE の送り先選びを開く URL */
export function lineShareUrl(text: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

/**
 * Microsoft Teams の「Teams で共有」を開く URL。文の中の最初の URL をリンクにし、残りを添える文にする。
 * Slack には外から文を入れて開く仕組みがないので、Slack はコピーして貼ってもらう
 */
export function teamsShareUrl(text: string): string {
  const href = text.match(/https?:\/\/\S+/)?.[0] ?? "";
  const msg = text.replace(href, "").trim();
  return `https://teams.microsoft.com/share?href=${encodeURIComponent(href)}&msgText=${encodeURIComponent(msg)}&preview=true`;
}

// LINE で送る文。友だちに自分で打つような短い文にする。
// アプリの宣伝の一言は付けない(URL を貼ると Date のカードが出るので、それで伝わる)

export function inviteText(title: string, url: string): string {
  return [`「${title}」の日程調整です`, "行ける日を入れてください", url].join("\n");
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
  const list = unpaid.map((u) => `・${u.name}さん ${yen(u.amount)}`);
  return audience === "student"
    ? [`${what}のお会計、まだの人お願いします`, ...list, "払ってたらごめん"].join("\n")
    : ["お疲れさまです。", `${what}のお会計がまだの方はお願いします。`, ...list, "行き違いでしたらすみません。"].join("\n");
}

/** 集金のページを送る文 */
export function collectText(title: string, url: string): string {
  return [`${title ? `「${title}」の` : ""}お会計です`, "払ったら自分の名前の「払った」を押してください", url].join("\n");
}

export function decidedText(title: string, date: string, start: number, shopName: string | null, url: string): string {
  return [`「${title}」決まりました`, `${dateLabel(date)} ${clock(start)}〜${shopName ? ` ${shopName}` : ""}`, url].join("\n");
}
