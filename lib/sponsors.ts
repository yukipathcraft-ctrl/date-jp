import type { Audience } from "./audience";

// 広告枠。飲食店以外の仙台の会社に、月いくらで直接売る。
// 飲食店からお金をもらうとホットペッパーのデータが使えなくなるので、飲食店は載せない。
// 学生の会と社会人の会で、合う広告だけを出す。載せる会社はここに書く。何もなければ広告枠は出ない

/**
 * 出す場所。どれも会が決まったあとに出す。
 * gift = 送別会・歓迎会の贈りもの(花束・記念品)、second = 二次会(カラオケなど)、
 * ride = 帰りの足(運転代行・タクシー)、campus = 学生のうちに(自動車学校など)
 */
export type Placement = "gift" | "second" | "ride" | "campus";

export type Sponsor = {
  id: string;
  placement: Placement;
  /** どちらの会に出すか */
  audience: Audience | "both";
  name: string;
  /** ひとこと(例: 国分町から30秒、2時間 学割あり) */
  catch: string;
  /** 押したときに開く先。お店のページか、電話(tel:)。ここに書いたもの以外には飛ばさない */
  url: string;
  /** 押すところの文字(例: 電話する、予約する) */
  action: string;
  /** 載せる期間の終わり(この日まで出す)。なければずっと */
  until?: string;
};

export const SPONSORS: Sponsor[] = [];

// 開発中だけ出す見本。広告主に見せる画面の確認に使う。本番では出さない
const SAMPLES: Sponsor[] = [
  {
    id: "sample-flower",
    placement: "gift",
    audience: "worker",
    name: "見本 フラワー 定禅寺",
    catch: "送別会の花束を、お店に直接お届けします。3,000円から・名入れの記念品も",
    url: "https://example.com/",
    action: "注文する",
  },
  {
    id: "sample-daiko",
    placement: "ride",
    audience: "worker",
    name: "見本 仙台運転代行",
    catch: "国分町・仙台駅まで15分でお迎え。会社の精算用に領収書も出します",
    url: "tel:0220000000",
    action: "電話する",
  },
  {
    id: "sample-karaoke",
    placement: "second",
    audience: "student",
    name: "見本 カラオケ 国分町",
    catch: "一次会のお店から歩いて3分・学割で 2時間1,500円〜",
    url: "https://example.com/",
    action: "空きを見る",
  },
  {
    id: "sample-driving",
    placement: "campus",
    audience: "student",
    name: "見本 仙台自動車学校",
    catch: "春休みに免許を。学割と友だち紹介で、ふたりとも1万円引き",
    url: "https://example.com/",
    action: "くわしく見る",
  },
];

/** 今出せる広告。期間が過ぎたものは出さない */
export function activeSponsors(now: Date = new Date()): Sponsor[] {
  const list = process.env.NODE_ENV === "production" ? SPONSORS : [...SPONSORS, ...SAMPLES];
  const today = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return list.filter((s) => !s.until || s.until >= today);
}

/** その場所に出す広告。会の種類(学生・社会人)に合うものだけ */
export function sponsorFor(placement: Placement, audience: Audience, now?: Date): Sponsor | null {
  return activeSponsors(now).find((s) => s.placement === placement && (s.audience === "both" || s.audience === audience)) ?? null;
}

export function findSponsor(id: string): Sponsor | null {
  return activeSponsors().find((s) => s.id === id) ?? null;
}
