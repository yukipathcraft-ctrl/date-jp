import type { Audience } from "../audience";
import type { Via } from "../invite";
import type { Answer } from "../summary";

export type Decision = { date: string; start: number; shopId: string | null; shopName: string | null };

export type Party = {
  id: string;
  title: string;
  audience: Audience;
  dates: string[];
  adminHash: string;
  decision: Decision | null;
  /** 幹事が決めた開始時刻(分)。null は前の会で、参加者が何時から来られるかを答える */
  start: number | null;
  /** 回答の締め切り(その日の終わりまで。日本時間)。null は締め切りなし */
  deadline: string | null;
  /** 幹事が「必ず来てほしい」にした人の名前(部長など)。その人が行ける日を先に出す */
  must: string[];
};

export type StoredAnswer = Answer & { tokenHash: string };

/** 使われ方の数(自分だけが見る集計の画面で使う)。誰が何をしたかは出さない */
export type Stats = {
  /** since より後に作られた会 */
  parties: number;
  /** そのうち日にちまで決まった会 */
  decided: number;
  /** since より後に保存された回答 */
  answers: number;
  /** since より後にお店のページへ飛んだ数 */
  clicks: number;
  /** since より後に押されたお店(多い順) */
  topShops: { shopId: string; count: number }[];
  /** これまでの合計 */
  totalParties: number;
  totalClicks: number;
  /** since より後に作られた会のうち、ほかの会で答えたことがある人が作った会 */
  fromGuests: number;
};

/** 集金のページに出す1人ぶん。金額はサーバーで計算し直したもの */
export type CollectionPerson = {
  id: number;
  name: string;
  /** 区分の名前(「多め」「×1.2」など)と記号、色 */
  label: string;
  mark: string;
  tone: "red" | "blue" | "yellow" | "green" | "purple" | "gray";
  amount: number;
  /** 店に立て替えた幹事。払う人に数えない */
  organizer: boolean;
};

/** 払ったかどうか。self = 本人が押した、host = 幹事が受け取りを記録した */
export type Payment = { by: "self" | "host" };

/** 傾斜会計の集金。参加した人は URL から自分の「払った」を押し、幹事は鍵の入った URL で受け取りを記録する */
export type Collection = {
  id: string;
  title: string;
  audience: Audience;
  total: number;
  people: CollectionPerson[];
  adminHash: string;
  payments: Record<number, Payment>;
  /** 会社や部署から出た補助(円)。お会計の合計からこれを引いた額を、みんなで割った。前の集金にはない */
  subsidy?: number;
};

export type AdEventKind = "view" | "click";
export type AdStat = { sponsorId: string; views: number; clicks: number };

export interface Store {
  /** via = どこから作られたか(答えたことがある人が作ったら guest) */
  createParty(party: Omit<Party, "decision" | "must"> & { via: Via }): Promise<void>;
  getParty(id: string): Promise<Party | null>;
  listAnswers(partyId: string): Promise<StoredAnswer[]>;
  /** id が同じなら上書き。名前が同じ別の人がいれば false */
  saveAnswer(partyId: string, answer: StoredAnswer): Promise<boolean>;
  setDecision(partyId: string, decision: Decision | null): Promise<void>;
  /** 回答の締め切りを変える。null で締め切りなし */
  setDeadline(partyId: string, deadline: string | null): Promise<void>;
  /** 必ず来てほしい人の名前を置き換える */
  setMust(partyId: string, names: string[]): Promise<void>;
  /** お店のページへ飛んだ数(誰が押したかは残さない)。「お店を探す」から来たときは partyId が null */
  logShopClick(partyId: string | null, shopId: string): Promise<void>;
  getStats(since: Date): Promise<Stats>;
  /** 広告が見られた・押された(誰かは残さない) */
  logAdEvent(sponsorId: string, kind: AdEventKind): Promise<void>;
  /** since より後の、広告ごとの見られた数と押された数 */
  getAdStats(since: Date): Promise<AdStat[]>;
  createCollection(collection: Omit<Collection, "payments">): Promise<void>;
  getCollection(id: string): Promise<Collection | null>;
  /** null なら「まだ」に戻す */
  setPayment(collectionId: string, personId: number, payment: Payment | null): Promise<void>;
}
