// 広告枠。飲食店以外の仙台の会社(タクシー・運転代行・カラオケなど)に、月いくらで直接売る。
// 飲食店からお金をもらうとホットペッパーのデータが使えなくなるので、飲食店は載せない。
// 載せる会社はここに書く。何もなければ広告枠は出ない

export type Placement = "second" | "ride";

export type Sponsor = {
  id: string;
  /** second = 二次会の欄(カラオケなど)、ride = 帰りの欄(タクシー・運転代行など) */
  placement: Placement;
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
    id: "sample-karaoke",
    placement: "second",
    name: "見本 カラオケ 国分町",
    catch: "一次会のお店から歩いて3分・飲み放題つき 2時間2,000円〜",
    url: "https://example.com/",
    action: "空きを見る",
  },
  {
    id: "sample-taxi",
    placement: "ride",
    name: "見本 仙台タクシー",
    catch: "国分町・仙台駅まで5分で迎えに行きます。運転代行もどうぞ",
    url: "tel:0220000000",
    action: "電話する",
  },
];

/** 今出せる広告。期間が過ぎたものは出さない */
export function activeSponsors(now: Date = new Date()): Sponsor[] {
  const list = process.env.NODE_ENV === "production" ? SPONSORS : [...SPONSORS, ...SAMPLES];
  const today = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return list.filter((s) => !s.until || s.until >= today);
}

export function sponsorFor(placement: Placement, now?: Date): Sponsor | null {
  return activeSponsors(now).find((s) => s.placement === placement) ?? null;
}

export function findSponsor(id: string): Sponsor | null {
  return activeSponsors().find((s) => s.id === id) ?? null;
}
