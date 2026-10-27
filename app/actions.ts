"use server";

import { AUDIENCES, isAudience } from "@/lib/audience";
import { canSetPayment, parseCollection, type CollectionInput } from "@/lib/collection";
import { AREAS, isAreaKey, isBudget, isGenreKey, isSecondGenreKey } from "@/lib/sendai";
import { findShop, mergeShops, searchSecondShops, searchShops, type Shop } from "@/lib/shops";
import { getStore } from "@/lib/store";
import { findSponsor } from "@/lib/sponsors";
import { loadParty } from "@/lib/view";
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
  const { name, dates, arrival, stay, budget, areas, memo, avoids, drinks, avoidNote } = answer;
  return {
    name,
    dates,
    arrival,
    stay,
    budget,
    areas,
    ...(memo ? { memo } : {}),
    avoids: avoids ?? [],
    drinks: drinks !== false,
    ...(avoidNote ? { avoidNote } : {}),
  };
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
  /** タバコが吸えるお店だけにする(社会人の画面だけで出す) */
  smoking?: boolean;
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
    const perArea = areas.length === 1 ? 10 : 6;
    const results = await Promise.all(
      areas.map((area) =>
        searchShops(
          {
            area,
            genres,
            budget,
            privateRoom: input.privateRoom === true,
            ...(input.smoking === true ? { smoking: "only" as const } : {}),
            size: 2,
            audience,
          },
          perArea,
        ),
      ),
    );
    return {
      shops: mergeShops(results.map((r) => r.shops), areas.length === 1 ? 10 : 16),
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

/** 傾斜会計から集金のページを作る。金額はサーバーで計算し直す */
export async function startCollection(input: CollectionInput): Promise<{ ok: true; id: string; adminToken: string } | Fail> {
  const parsed = parseCollection(input);
  if (!parsed.ok) return parsed;
  const id = generateGroupId();
  const adminToken = generateToken();
  try {
    await getStore().createCollection({ id, ...parsed.value, adminHash: hashToken(adminToken) });
  } catch (e) {
    console.error("[collection] 作れませんでした", e);
    return { ok: false, error: "集金のページを作れませんでした。少し待ってからもう一度お試しください" };
  }
  return { ok: true, id, adminToken };
}

/**
 * 払ったかどうかを切り替える。幹事(鍵が合う)は誰でも切り替えられ、受け取りとして記録する。
 * 参加した人は「払った」にでき、自分で押したものだけ取り消せる
 */
export async function setCollectionPayment(
  collectionId: string,
  personId: number,
  paid: boolean,
  adminToken: string | null,
): Promise<{ ok: true } | Fail> {
  const store = getStore();
  const c = await store.getCollection(collectionId);
  if (!c) return { ok: false, error: "集金のページが見つかりません" };
  const person = c.people.find((p) => p.id === personId);
  if (!person || person.organizer) return { ok: false, error: "この人の支払いは変えられません" };
  const isHost = verifyToken(adminToken, c.adminHash);
  if (!canSetPayment(c.payments[personId], paid === true, isHost)) {
    return { ok: false, error: "幹事が受け取りを記録したものは、幹事しか戻せません" };
  }
  await store.setPayment(collectionId, personId, paid === true ? { by: isHost ? "host" : "self" } : null);
  return { ok: true };
}

/** 「集金のチェック」の一覧に出す、集金ごとの進み具合。払ったかどうかの数だけを返す */
export async function collectionProgress(
  ids: string[],
): Promise<{ id: string; payers: number; paid: number; unpaidYen: number }[]> {
  const list = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === "string" && /^[a-z0-9]{6,20}$/.test(id)).slice(0, 30);
  const store = getStore();
  const rows = await Promise.all(
    list.map(async (id) => {
      try {
        const c = await store.getCollection(id);
        if (!c) return null;
        const payers = c.people.filter((p) => !p.organizer);
        const unpaid = payers.filter((p) => !c.payments[p.id]);
        return { id, payers: payers.length, paid: payers.length - unpaid.length, unpaidYen: unpaid.reduce((s, p) => s + p.amount, 0) };
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((r): r is NonNullable<typeof r> => r !== null);
}

/**
 * 二次会のお店。一次会のお店が決まっていればその近く、なければ一番人気の場所の近くで探す。
 * 人数は二次会に残れる人(いなければ行く人全員)
 */
export async function findSecondShops(
  partyId: string,
  genre: string | null,
): Promise<{ shops: Shop[]; size: number; near: string }> {
  const view = await loadParty(partyId);
  if (!view?.party.decision) return { shops: [], size: 0, near: "" };
  const { party, summary } = view;
  const decision = party.decision!;
  const first = decision.shopId ? await findShop(decision.shopId) : null;
  const area = AREAS.find((a) => a.key === summary.area) ?? AREAS[0];
  const base = first?.lat != null && first.lng != null ? { lat: first.lat, lng: first.lng } : { lat: area.lat, lng: area.lng };
  const size = summary.secondParty.length || summary.attendees.length;
  const shops = await searchSecondShops({
    ...base,
    size,
    genre: isSecondGenreKey(genre) ? genre : null,
    exclude: decision.shopId,
    area: area.key,
  });
  return { shops, size, near: first?.lat != null ? (decision.shopName ?? first.name) : area.label };
}

/** 広告が画面に出たことを数える。lib/sponsors.ts にある広告だけを数える */
export async function logAdView(sponsorId: string): Promise<void> {
  const sponsor = typeof sponsorId === "string" ? findSponsor(sponsorId) : null;
  if (!sponsor) return;
  await getStore()
    .logAdEvent(sponsor.id, "view")
    .catch((e) => console.error("[ad] 数えられませんでした", e));
}
