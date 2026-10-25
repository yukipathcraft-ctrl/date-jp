import { createClient } from "@supabase/supabase-js";
import type { Answer } from "../summary";
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
        await db.from("parties").insert({ id: party.id, title: party.title, dates: party.dates, admin_hash: party.adminHash }),
      );
    },
    async getParty(id) {
      const row = check<{ id: string; title: string; dates: string[]; admin_hash: string; decision: Decision | null } | null>(
        await db.from("parties").select("id, title, dates, admin_hash, decision").eq("id", id).maybeSingle(),
      );
      return row ? { id: row.id, title: row.title, dates: row.dates, adminHash: row.admin_hash, decision: row.decision } : null;
    },
    async listAnswers(partyId) {
      const rows = check<AnswerRow[]>(
        await db.from("answers").select("id, name, token_hash, data").eq("party_id", partyId).order("created_at"),
      );
      return rows.map((r): StoredAnswer => ({ ...r.data, id: r.id, name: r.name, tokenHash: r.token_hash }));
    },
    async saveAnswer(partyId, answer) {
      const { id, name, tokenHash, ...data } = answer;
      const result = await db
        .from("answers")
        .upsert({ id, party_id: partyId, name, token_hash: tokenHash, data, updated_at: new Date().toISOString() });
      // 同じ飲み会で同じ名前(unique 制約)
      if (result.error?.code === "23505") return false;
      check(result);
      return true;
    },
    async setDecision(partyId, decision) {
      check(await db.from("parties").update({ decision }).eq("id", partyId));
    },
    async logShopClick(partyId, shopId) {
      check(await db.from("shop_clicks").insert({ party_id: partyId, shop_id: shopId }));
    },
  };
}
