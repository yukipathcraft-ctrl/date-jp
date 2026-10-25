import type { Answer } from "../summary";

export type Decision = { date: string; start: number; shopId: string | null; shopName: string | null };

export type Party = {
  id: string;
  title: string;
  dates: string[];
  adminHash: string;
  decision: Decision | null;
};

export type StoredAnswer = Answer & { tokenHash: string };

export interface Store {
  createParty(party: Omit<Party, "decision">): Promise<void>;
  getParty(id: string): Promise<Party | null>;
  listAnswers(partyId: string): Promise<StoredAnswer[]>;
  /** id が同じなら上書き。名前が同じ別の人がいれば false */
  saveAnswer(partyId: string, answer: StoredAnswer): Promise<boolean>;
  setDecision(partyId: string, decision: Decision | null): Promise<void>;
  /** お店のページへ飛んだ数(誰が押したかは残さない) */
  logShopClick(partyId: string, shopId: string): Promise<void>;
}
