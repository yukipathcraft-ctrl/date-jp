import { createClient } from "@supabase/supabase-js";
import { isAudience } from "../audience";
import type { Answer } from "../summary";
import { countShops } from "./stats";
import type { Decision, Store, StoredAnswer } from "./types";

// スキーマから型を生成していないので、行の型は呼び出し側で指定する
function check<T = unknown>(result: { data: unknown; error: { message: string; code?: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

type AnswerRow = { id: string; name: string; token_hash: string; data: Omit<Answer, "id" | "name"> };

export function createSupabaseStore(url: string, serviceRoleKey: string): Store {
  const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    async createParty(party) {
      check(
        await db.from("nomi_parties").insert({
          id: party.id,
          title: party.title,
          audience: party.audience,
          dates: party.dates,
          admin_hash: party.adminHash,
        }),
      );
    },
    async getParty(id) {
      const row = check<
        { id: string; title: string; audience: string; dates: string[]; admin_hash: string; decision: Decision | null } | null
      >(
        await db.from("nomi_parties").select("id, title, audience, dates, admin_hash, decision").eq("id", id).maybeSingle(),
      );
      return row ? {
            id: row.id,
            title: row.title,
            audience: isAudience(row.audience) ? row.audience : "student",
            dates: row.dates,
            adminHash: row.admin_hash,
            decision: row.decision,
          } : null;
    },
    async listAnswers(partyId) {
      const rows = check<AnswerRow[]>(
        await db.from("nomi_answers").select("id, name, token_hash, data").eq("party_id", partyId).order("created_at"),
      );
      return rows.map((r): StoredAnswer => ({ ...r.data, id: r.id, name: r.name, tokenHash: r.token_hash }));
    },
    async saveAnswer(partyId, answer) {
      const { id, name, tokenHash, ...data } = answer;
      const result = await db
        .from("nomi_answers")
        .upsert({ id, party_id: partyId, name, token_hash: tokenHash, data, updated_at: new Date().toISOString() });
      // 同じ飲み会で同じ名前(unique 制約)
      if (result.error?.code === "23505") return false;
      check(result);
      return true;
    },
    async setDecision(partyId, decision) {
      check(await db.from("nomi_parties").update({ decision }).eq("id", partyId));
    },
    async logShopClick(partyId, shopId) {
      check(await db.from("nomi_shop_clicks").insert({ party_id: partyId, shop_id: shopId }));
    },
    async getStats(since) {
      const at = since.toISOString();
      const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
        const r = await q;
        if (r.error) throw new Error(r.error.message);
        return r.count ?? 0;
      };
      const head = { count: "exact" as const, head: true };
      const [parties, decided, answers, totalParties, totalClicks, clickRows] = await Promise.all([
        count(db.from("nomi_parties").select("id", head).gte("created_at", at)),
        count(db.from("nomi_parties").select("id", head).gte("created_at", at).not("decision", "is", null)),
        count(db.from("nomi_answers").select("id", head).gte("created_at", at)),
        count(db.from("nomi_parties").select("id", head)),
        count(db.from("nomi_shop_clicks").select("id", head)),
        db.from("nomi_shop_clicks").select("shop_id").gte("created_at", at).limit(10000),
      ]);
      const ids = check<{ shop_id: string }[]>(clickRows).map((r) => r.shop_id);
      return { parties, decided, answers, clicks: ids.length, topShops: countShops(ids), totalParties, totalClicks };
    },
  };
}
