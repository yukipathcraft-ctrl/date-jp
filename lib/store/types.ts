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

export interface Store {
  createParty(party: Omit<Party, "decision">): Promise<void>;
  getParty(id: string): Promise<Party | null>;
  listAnswers(partyId: string): Promise<StoredAnswer[]>;
  /** id が同じなら上書き。名前が同じ別の人がいれば false */
  saveAnswer(partyId: string, answer: StoredAnswer): Promise<boolean>;
  setDecision(partyId: string, decision: Decision | null): Promise<void>;
  /** お店のページへ飛んだ数(誰が押したかは残さない)。「お店を探す」から来たときは partyId が null */
  logShopClick(partyId: string | null, shopId: string): Promise<void>;
}
