"use server";

import { isAudience } from "@/lib/audience";
import { isAreaKey, isBudget, isGenreKey } from "@/lib/sendai";
import { findShop, searchShops, type Shop } from "@/lib/shops";
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
  area: string;
  genre: string | null;
  budget: number | null;
  privateRoom: boolean;
  audience: string;
}): Promise<{ shops: Shop[]; otherArea: boolean }> {
  if (!isAreaKey(input.area)) return { shops: [], otherArea: false };
  return searchShops(
    {
      area: input.area,
      genre: isGenreKey(input.genre) ? input.genre : null,
      budget: isBudget(input.budget) ? input.budget : null,
      privateRoom: input.privateRoom === true,
      size: 2,
      audience: isAudience(input.audience) ? input.audience : undefined,
    },
    6,
  );
}
