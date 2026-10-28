import { isFormal, type Audience } from "./audience";
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

/** start = 幹事が決めた開始時刻(分)。あれば「19:00〜」と添える。deadline(回答の締め切り)があれば、いつまでに答えるかを書く */
export function inviteText(title: string, url: string, start: number | null = null, deadline: string | null = null): string {
  return [
    `「${title}」の日程調整です${start !== null ? `(${clock(start)}〜)` : ""}`,
    deadline ? `${dateLabel(deadline)}までに、行ける日を入れてください` : "行ける日を入れてください",
    url,
  ].join("\n");
}

/** 締め切りの前に、まだ答えていない人へ送る文。誰がまだかは書かない(グループに送るので、名指しにしない) */
export function deadlineReminderText(title: string, url: string, deadline: string, daysLeft: number): string {
  const when = daysLeft === 0 ? "今日" : daysLeft === 1 ? "明日" : dateLabel(deadline);
  return [`「${title}」の日程、${when}までが締め切りです`, "まだの人は入れてください", url].join("\n");
}

/**
 * 会計の催促の文。まだ払っていない人の名前と金額を並べる。会社の会だけ敬語にする
 * (責める言い方にしない。誰が払ったかは書かず、まだの人だけを書く)
 */
export function reminderText(
  audience: Audience,
  title: string,
  unpaid: { name: string; amount: number }[],
): string {
  const what = title.trim() ? `「${title.trim()}」` : isFormal(audience) ? "先日の会" : "この前の飲み会";
  const list = unpaid.map((u) => `・${u.name}さん ${yen(u.amount)}`);
  return !isFormal(audience)
    ? [`${what}のお会計、まだの人お願いします`, ...list, "払ってたらごめん"].join("\n")
    : [
        "お疲れさまです。",
        `${what}のお会計につきまして、お済みでない方はお支払いをお願いいたします。`,
        ...list,
        "行き違いでお支払い済みの場合は、ご容赦ください。",
      ].join("\n");
}

/** 集金のページを送る文。会社の会は敬語にする */
export function collectText(title: string, url: string, audience: Audience = "student"): string {
  const what = title ? `「${title}」の` : "";
  return isFormal(audience)
    ? [`${what}お会計のご案内です。`, "ご自身の金額をご確認のうえ、幹事までお支払いください。", url].join("\n")
    : [`${what}お会計です`, "自分の金額を見て、幹事に払ってね", url].join("\n");
}

export function decidedText(title: string, date: string, start: number, shopName: string | null, url: string): string {
  return [`「${title}」決まりました`, `${dateLabel(date)} ${clock(start)}〜${shopName ? ` ${shopName}` : ""}`, url].join("\n");
}
