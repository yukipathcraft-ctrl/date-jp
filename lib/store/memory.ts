import { countAds, countShops } from "./stats";
import type { AdEventKind, Collection, Party, Stats, StoredAnswer, Store } from "./types";

// 開発用の仮DB。再起動で消える。本番では使わない
type Db = {
  parties: Map<string, Party & { createdAt: number }>;
  answers: Map<string, (StoredAnswer & { createdAt: number })[]>;
  clicks: { partyId: string | null; shopId: string; at: number }[];
  ads?: { sponsorId: string; kind: AdEventKind; at: number }[];
  collections: Map<string, Collection>;
};

// 開発サーバーの再読み込みで消えないよう、globalThis に置く
const g = globalThis as unknown as { __nomi?: Db };
const db: Db = (g.__nomi ??= { parties: new Map(), answers: new Map(), clicks: [], collections: new Map() });
// 集金を足す前から動いている開発サーバーでも使えるようにする
db.collections ??= new Map();

export const memoryStore: Store = {
  async createParty(party) {
    db.parties.set(party.id, { ...party, decision: null, createdAt: Date.now() });
  },
  async getParty(id) {
    const p = db.parties.get(id);
    if (!p) return null;
    const party: Party & { createdAt?: number } = { ...structuredClone(p), region: p.region ?? null };
    delete party.createdAt;
    return party;
  },
  async listAnswers(partyId) {
    return structuredClone(db.answers.get(partyId) ?? []).map((a): StoredAnswer => {
      const answer: StoredAnswer & { createdAt?: number } = a;
      delete answer.createdAt;
      return answer;
    });
  },
  async saveAnswer(partyId, answer) {
    const list = db.answers.get(partyId) ?? [];
    if (list.some((a) => a.id !== answer.id && a.name === answer.name)) return false;
    const i = list.findIndex((a) => a.id === answer.id);
    if (i >= 0) list[i] = { ...structuredClone(answer), createdAt: list[i].createdAt };
    else list.push({ ...structuredClone(answer), createdAt: Date.now() });
    db.answers.set(partyId, list);
    return true;
  },
  async setDecision(partyId, decision) {
    const p = db.parties.get(partyId);
    if (p) p.decision = decision;
  },
  async logShopClick(partyId, shopId) {
    db.clicks.push({ partyId, shopId, at: Date.now() });
  },
  async getStats(since) {
    const t = since.getTime();
    const parties = [...db.parties.values()].filter((p) => p.createdAt >= t);
    const clicks = db.clicks.filter((c) => c.at >= t);
    return {
      parties: parties.length,
      decided: parties.filter((p) => p.decision !== null).length,
      answers: [...db.answers.values()].flat().filter((a) => a.createdAt >= t).length,
      clicks: clicks.length,
      topShops: countShops(clicks.map((c) => c.shopId)),
      totalParties: db.parties.size,
      totalClicks: db.clicks.length,
    } satisfies Stats;
  },
  async logAdEvent(sponsorId, kind) {
    (db.ads ??= []).push({ sponsorId, kind, at: Date.now() });
  },
  async getAdStats(since) {
    return countAds((db.ads ?? []).filter((e) => e.at >= since.getTime()));
  },
  async createCollection(collection) {
    db.collections.set(collection.id, { ...structuredClone(collection), payments: {} });
  },
  async getCollection(id) {
    const c = db.collections.get(id);
    return c ? structuredClone(c) : null;
  },
  async setPayment(collectionId, personId, payment) {
    const c = db.collections.get(collectionId);
    if (!c) return;
    if (payment) c.payments[personId] = payment;
    else delete c.payments[personId];
  },
};
