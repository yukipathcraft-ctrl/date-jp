import type { Audience } from "../audience";
import type { Answer } from "../summary";

export type Decision = { date: string; start: number; shopId: string | null; shopName: string | null };

export type Party = {
  id: string;
  title: string;
  audience: Audience;
  dates: string[];
  adminHash: string;
  decision: Decision | null;
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
}
