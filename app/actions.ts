"use server";

import { AUDIENCES, isAudience } from "@/lib/audience";
import { isAreaKey, isBudget, isGenreKey } from "@/lib/sendai";
import { findShop, mergeShops, searchShops, type Shop } from "@/lib/shops";
import { getStore } from "@/lib/store";
import { summarize } from "@/lib/summary";
import { generateGroupId, generateToken, hashToken, verifyToken } from "@/lib/tokens";
import { parseAnswer, parseParty, type AnswerInput } from "@/lib/validation";

type Fail = { ok: false; error: string };

export async function createParty(input: { title: string; audience: string; dates: string[] }): Promise<{ ok: true; id: string; adminToken: string } | Fail> {
  const parsed = parseParty(input);
  if (!parsed.ok) return parsed;
  const id = generateGroupId();
  const adminToken = generateToken();
  try {
    await getStore().createParty({ id, ...parsed.value, adminHash: hashToken(adminToken) });
  } catch (e) {
    console.error(e);
    return { ok: false, error: "作れませんでした。時間をおいてもう一度お試しください" };
  }
  return { ok: true, id, adminToken };
}

export async function saveAnswer(
  partyId: string,
  mine: { answerId: string; token: string } | null,
  input: Record<string, unknown>,
): Promise<{ ok: true; answerId: string; token: string } | Fail> {
  const store = getStore();
  const party = await store.getParty(partyId);
  if (!party) return { ok: false, error: "飲み会が見つかりません" };
  const parsed = parseAnswer(input, party.dates);
  if (!parsed.ok) return parsed;

  let answerId = crypto.randomUUID();
  let token = generateToken();
  if (mine) {
    // 直すときは、本人のトークンを照らし合わせる
    const existing = (await store.listAnswers(partyId)).find((a) => a.id === mine.answerId);
    if (existing && verifyToken(mine.token, existing.tokenHash)) {
      answerId = existing.id;
      token = mine.token;
    }
  }
  const saved = await store.saveAnswer(partyId, { ...parsed.value, id: answerId, tokenHash: hashToken(token) });
  if (!saved) return { ok: false, error: "同じ名前の人がもういます。名字を足すなど、少し変えてください" };
  return { ok: true, answerId, token };
}

/** 自分の回答を直すときに、前の回答を読む(予算はほかの人には見せないので、本人にだけ返す) */
export async function getMyAnswer(partyId: string, answerId: string, token: string): Promise<AnswerInput | null> {
  const answer = (await getStore().listAnswers(partyId)).find((a) => a.id === answerId);
  if (!answer || !verifyToken(token, answer.tokenHash)) return null;
  const { name, dates, arrival, stay, budget, areas } = answer;
  return { name, dates, arrival, stay, budget, areas };
}

export async function decide(
  partyId: string,
  adminToken: string,
  choice: { date: string; shopId: string | null } | null,
): Promise<{ ok: true } | Fail> {
  const store = getStore();
  const party = await store.getParty(partyId);
  if (!party || !verifyToken(adminToken, party.adminHash)) return { ok: false, error: "幹事のURLから開いてください" };
  if (choice === null) {
    await store.setDecision(partyId, null);
    return { ok: true };
  }
  if (!party.dates.includes(choice.date)) return { ok: false, error: "候補の日から選んでください" };
  const summary = summarize(party.dates, await store.listAnswers(partyId), choice.date);
  if (summary.start === null) return { ok: false, error: "その日に行ける人がいません" };
  const shop = choice.shopId ? await findShop(choice.shopId) : null;
  await store.setDecision(partyId, {
    date: choice.date,
    start: summary.start,
    shopId: shop?.id ?? null,
    shopName: shop?.name ?? null,
  });
  return { ok: true };
}

/** 「お店を探す」から使う。条件はすべて選択肢の中から受け取る */
export async function findShops(input: {
  areas: string[];
  genres: string[];
  budget: number | null;
  privateRoom: boolean;
  audience: string;
}): Promise<{ shops: Shop[]; otherArea: boolean; raisedTo: number | null }> {
  const areas = [...new Set(Array.isArray(input.areas) ? input.areas : [])].filter(isAreaKey);
  if (areas.length === 0) return { shops: [], otherArea: false, raisedTo: null };
  const genres = [...new Set(Array.isArray(input.genres) ? input.genres : [])].filter(isGenreKey);
  const audience = isAudience(input.audience) ? input.audience : "student";
  const budgets = AUDIENCES[audience].budgets;
  // 予算を「決めない」にしても、学生なら6,000円、社会人なら8,000円までのお店にとどめる
  const asked = isBudget(input.budget) ? input.budget : Math.max(...budgets);
  // 場所をいくつか選んだら、場所ごとに探して交互に並べる
  const search = async (budget: number) => {
    const perArea = areas.length === 1 ? 6 : 4;
    const results = await Promise.all(
      areas.map((area) =>
        searchShops({ area, genres, budget, privateRoom: input.privateRoom === true, size: 2, audience }, perArea),
      ),
    );
    return {
      shops: mergeShops(results.map((r) => r.shops), areas.length === 1 ? 6 : 12),
      otherArea: results.every((r) => r.otherArea || r.shops.length === 0) && results.some((r) => r.otherArea),
    };
  };
  const first = await search(asked);
  if (first.shops.length > 0) return { ...first, raisedTo: null };
  // 1軒もなければ、見つかるまで予算を1段ずつ上げる
  for (const higher of budgets.filter((b) => b > asked)) {
    const next = await search(higher);
    if (next.shops.length > 0) return { ...next, raisedTo: higher };
  }
  return { ...first, raisedTo: null };
}
