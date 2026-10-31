import { createClient } from "@supabase/supabase-js";
import { isAudience } from "../audience";
import type { Answer } from "../summary";
import { countAds, countShops } from "./stats";
import type { AdEventKind, Collection, CollectionPerson, Decision, Payment, Store, StoredAnswer } from "./types";

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
          start_minutes: party.start,
          via: party.via,
          // 締め切りのない会は欄に何も書かない(締め切りの欄を足す前の DB でも作れるようにする)
          ...(party.deadline ? { answer_deadline: party.deadline } : {}),
        }),
      );
    },
    async getParty(id) {
      const row = check<
        { id: string; title: string; audience: string; dates: string[]; admin_hash: string; decision: Decision | null; start_minutes: number | null; answer_deadline: string | null; must_names: string[] | null } | null
      >(
        await db.from("nomi_parties").select("id, title, audience, dates, admin_hash, decision, start_minutes, answer_deadline, must_names").eq("id", id).maybeSingle(),
      );
      return row ? {
            id: row.id,
            title: row.title,
            audience: isAudience(row.audience) ? row.audience : "student",
            dates: row.dates,
            adminHash: row.admin_hash,
            decision: row.decision,
            start: row.start_minutes ?? null,
            deadline: row.answer_deadline ?? null,
            must: row.must_names ?? [],
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
    async setMust(partyId, names) {
      check(await db.from("nomi_parties").update({ must_names: names }).eq("id", partyId));
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
      const [parties, decided, answers, totalParties, totalClicks, clickRows, fromGuests] = await Promise.all([
        count(db.from("nomi_parties").select("id", head).gte("created_at", at)),
        count(db.from("nomi_parties").select("id", head).gte("created_at", at).not("decision", "is", null)),
        count(db.from("nomi_answers").select("id", head).gte("created_at", at)),
        count(db.from("nomi_parties").select("id", head)),
        count(db.from("nomi_shop_clicks").select("id", head)),
        db.from("nomi_shop_clicks").select("shop_id").gte("created_at", at).limit(10000),
        count(db.from("nomi_parties").select("id", head).gte("created_at", at).eq("via", "guest")),
      ]);
      const ids = check<{ shop_id: string }[]>(clickRows).map((r) => r.shop_id);
      return { parties, decided, answers, clicks: ids.length, topShops: countShops(ids), totalParties, totalClicks, fromGuests };
    },
    async logAdEvent(sponsorId, kind) {
      check(await db.from("nomi_ad_events").insert({ sponsor_id: sponsorId, kind }));
    },
    async getAdStats(since) {
      const rows = check<{ sponsor_id: string; kind: AdEventKind }[]>(
        await db.from("nomi_ad_events").select("sponsor_id, kind").gte("created_at", since.toISOString()).limit(100000),
      );
      return countAds(rows.map((r) => ({ sponsorId: r.sponsor_id, kind: r.kind })));
    },
    async createCollection(collection) {
      const { id, adminHash, ...data } = collection;
      check(await db.from("nomi_collections").insert({ id, admin_hash: adminHash, data }));
    },
    async getCollection(id) {
      const [row, pays] = await Promise.all([
        db.from("nomi_collections").select("id, admin_hash, data").eq("id", id).maybeSingle(),
        db.from("nomi_collection_payments").select("person_id, paid_by").eq("collection_id", id),
      ]);
      const r = check<{ id: string; admin_hash: string; data: Omit<Collection, "id" | "adminHash" | "payments"> & { people: CollectionPerson[] } } | null>(row);
      if (!r) return null;
      const payments: Record<number, Payment> = {};
      for (const p of check<{ person_id: number; paid_by: string }[]>(pays)) {
        payments[p.person_id] = { by: p.paid_by === "host" ? "host" : "self" };
      }
      return { ...r.data, audience: isAudience(r.data.audience) ? r.data.audience : "student", id: r.id, adminHash: r.admin_hash, payments };
    },
    async markCollectionPaid(collectionId, sessionId) {
      // 集金の中身(data)に、買ったことを足す
      const row = check<{ data: Record<string, unknown> } | null>(
        await db.from("nomi_collections").select("data").eq("id", collectionId).maybeSingle(),
      );
      if (!row) return;
      check(
        await db
          .from("nomi_collections")
          .update({ data: { ...row.data, pro: { sessionId, at: new Date().toISOString() } } })
          .eq("id", collectionId),
      );
    },
    async setPayment(collectionId, personId, payment) {
      if (payment) {
        check(
          await db
            .from("nomi_collection_payments")
            .upsert({ collection_id: collectionId, person_id: personId, paid_by: payment.by, paid_at: new Date().toISOString() }),
        );
      } else {
        check(await db.from("nomi_collection_payments").delete().eq("collection_id", collectionId).eq("person_id", personId));
      }
    },
  };
}
