import type { Audience } from "../audience";
import type { Region } from "../region";
import type { Answer } from "../summary";

export type Decision = { date: string; start: number; shopId: string | null; shopName: string | null };

export type Party = {
  id: string;
  title: string;
  audience: Audience;
  dates: string[];
  adminHash: string;
  decision: Decision | null;
  /** 地域。null は仙台 */
  region: Region;
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
};

export type AdEventKind = "view" | "click";
export type AdStat = { sponsorId: string; views: number; clicks: number };

export interface Store {
  createParty(party: Omit<Party, "decision">): Promise<void>;
  getParty(id: string): Promise<Party | null>;
  listAnswers(partyId: string): Promise<StoredAnswer[]>;
  /** id が同じなら上書き。名前が同じ別の人がいれば false */
  saveAnswer(partyId: string, answer: StoredAnswer): Promise<boolean>;
  setDecision(partyId: string, decision: Decision | null): Promise<void>;
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
