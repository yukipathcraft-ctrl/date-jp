import type { Party, StoredAnswer, Store } from "./types";

// 開発用の仮DB。再起動で消える。本番では使わない
type Db = { parties: Map<string, Party>; answers: Map<string, StoredAnswer[]>; clicks: { partyId: string | null; shopId: string }[] };

// 開発サーバーの再読み込みで消えないよう、globalThis に置く
const g = globalThis as unknown as { __nomise?: Db };
const db: Db = (g.__nomise ??= { parties: new Map(), answers: new Map(), clicks: [] });

export const memoryStore: Store = {
  async createParty(party) {
    db.parties.set(party.id, { ...party, decision: null });
  },
  async getParty(id) {
    const p = db.parties.get(id);
    return p ? structuredClone(p) : null;
  },
  async listAnswers(partyId) {
    return structuredClone(db.answers.get(partyId) ?? []);
  },
  async saveAnswer(partyId, answer) {
    const list = db.answers.get(partyId) ?? [];
    if (list.some((a) => a.id !== answer.id && a.name === answer.name)) return false;
    const i = list.findIndex((a) => a.id === answer.id);
    if (i >= 0) list[i] = structuredClone(answer);
    else list.push(structuredClone(answer));
    db.answers.set(partyId, list);
    return true;
  },
  async setDecision(partyId, decision) {
    const p = db.parties.get(partyId);
    if (p) p.decision = decision;
  },
  async logShopClick(partyId, shopId) {
    db.clicks.push({ partyId, shopId });
  },
};
