"use server";

import { AUDIENCES, isAudience } from "@/lib/audience";
import { canSetPayment, isConfirmed, parseCollection, type CollectionInput } from "@/lib/collection";
import { AREAS, isBudget, isGenreKey, isSecondGenreKey } from "@/lib/sendai";
import { findShop, searchSecondShops, searchShops, type Shop } from "@/lib/shops";
import { getStore } from "@/lib/store";
import type { Decision } from "@/lib/store/types";
import { findSponsor } from "@/lib/sponsors";
import { loadParty } from "@/lib/view";
import { summarize } from "@/lib/summary";
import { isStation, normalizeStationQuery, type Station } from "@/lib/stations";
import { generateGroupId, generateToken, hashToken, verifyToken } from "@/lib/tokens";
import { parseAnswer, parseParty, type AnswerInput } from "@/lib/validation";

type Fail = { ok: false; error: string };

/** via = "guest" なら、ほかの会で答えたことがある人が作った(招待から幹事が生まれた数を数える) */
export async function createParty(input: {
  title: string;
  audience: string;
  dates: string[];
  start: number;
  via?: string;
}): Promise<{ ok: true; id: string; adminToken: string } | Fail> {
  const parsed = parseParty(input);
  if (!parsed.ok) return parsed;
  const id = generateGroupId();
  const adminToken = generateToken();
  try {
    await getStore().createParty({ id, ...parsed.value, adminHash: hashToken(adminToken), via: input.via === "guest" ? "guest" : null });
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
  const parsed = parseAnswer(input, party.dates, party.start);
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
  const { name, dates, arrival, stay, budget, areas, station, memo, avoids, drinks, smokes, likes, avoidNote } = answer;
  return {
    name,
    dates,
    arrival,
    stay,
    budget,
    areas,
    station: station ?? null,
    ...(memo ? { memo } : {}),
    avoids: avoids ?? [],
    drinks: drinks !== false,
    ...(smokes ? { smokes: true } : {}),
    likes: likes ?? [],
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

/** 必ず来てほしい人を変える(幹事だけ)。答えた人の名前の中から選ぶ */
export async function setMust(partyId: string, adminToken: string, names: string[]): Promise<{ ok: true } | Fail> {
  const store = getStore();
  const party = await store.getParty(partyId);
  if (!party || !verifyToken(adminToken, party.adminHash)) return { ok: false, error: "幹事のURLから開いてください" };
  const answered = new Set((await store.listAnswers(partyId)).map((a) => a.name));
  const picked = [...new Set(Array.isArray(names) ? names : [])].filter((n) => typeof n === "string" && answered.has(n)).slice(0, 10);
  await store.setMust(partyId, picked);
  return { ok: true };
}

/** 「お店を探す」から使う。条件はすべて選択肢の中から受け取る */
export async function findShops(input: {
  /** 飲む場所の駅(全国) */
  station: unknown;
  genres: string[];
  budget: number | null;
  privateRoom: boolean;
  /** タバコが吸えるお店だけにする(社会人の画面だけで出す) */
  smoking?: boolean;
  audience: string;
}): Promise<{ shops: Shop[]; otherArea: boolean; raisedTo: number | null }> {
  if (!isStation(input.station)) return { shops: [], otherArea: false, raisedTo: null };
  const point = { lat: input.station.lat, lng: input.station.lng };
  const genres = [...new Set(Array.isArray(input.genres) ? input.genres : [])].filter(isGenreKey);
  const audience = isAudience(input.audience) ? input.audience : "student";
  const budgets = AUDIENCES[audience].budgets;
  // 予算を「決めない」にしても、学生なら6,000円、社会人なら8,000円までのお店にとどめる
  const asked = isBudget(input.budget) ? input.budget : Math.max(...budgets);
  // 選んだ駅の近く(500m、足りなければ1km)で探す
  const search = (budget: number) =>
    searchShops(
      {
        area: "station",
        point,
        genres,
        budget,
        privateRoom: input.privateRoom === true,
        ...(input.smoking === true ? { smoking: "only" as const } : {}),
        size: 2,
        audience,
      },
      10,
    );
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
 * 払ったかどうかを切り替える。幹事(鍵が合う)だけが、受け取りとして記録できる
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
  if (!canSetPayment(isHost)) return { ok: false, error: "受け取りの記録は、幹事だけができます" };
  await store.setPayment(collectionId, personId, paid === true ? { by: "host" } : null);
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
        const unpaid = payers.filter((p) => !isConfirmed(c.payments[p.id]));
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
  const base =
    first?.lat != null && first.lng != null
      ? { lat: first.lat, lng: first.lng }
      : summary.meeting ?? { lat: area.lat, lng: area.lng };
  const size = summary.secondParty.length || summary.attendees.length;
  const shops = await searchSecondShops({
    ...base,
    size,
    genre: isSecondGenreKey(genre) ? genre : null,
    exclude: decision.shopId,
    area: area.key,
  });
  return {
    shops,
    size,
    near: first?.lat != null ? (decision.shopName ?? first.name) : summary.meeting ? `${summary.meeting.name}駅` : area.label,
  };
}

/**
 * 駅名から駅を探す(全国)。HeartRails Express の無料の駅データを使う。
 * 同じ駅の路線ちがいは1つにまとめ、名前と都道府県と場所だけを返す
 */
export async function searchStations(query: string): Promise<Station[]> {
  const q = typeof query === "string" ? normalizeStationQuery(query) : "";
  if (!q) return [];
  try {
    const res = await fetch(`https://express.heartrails.com/api/json?method=getStations&name=${encodeURIComponent(q)}`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { response?: { station?: { name: string; prefecture: string; x: number; y: number }[] } };
    const out: Station[] = [];
    for (const s of body.response?.station ?? []) {
      if (out.some((o) => o.name === s.name && o.pref === s.prefecture)) continue;
      out.push({ name: s.name, pref: s.prefecture, lat: Number(s.y), lng: Number(s.x) });
    }
    return out.slice(0, 8);
  } catch (e) {
    console.error("[stations] 駅を探せませんでした", e);
    return [];
  }
}

/** 広告が画面に出たことを数える。lib/sponsors.ts にある広告だけを数える */
export async function logAdView(sponsorId: string): Promise<void> {
  const sponsor = typeof sponsorId === "string" ? findSponsor(sponsorId) : null;
  if (!sponsor) return;
  await getStore()
    .logAdEvent(sponsor.id, "view")
    .catch((e) => console.error("[ad] 数えられませんでした", e));
}

/** going = 決まった日に行く人の数(決まっていなければ 0) */
export type PartyStatus = { decision: Decision | null; answered: number; going: number };

/**
 * ホームの「あなたの会」を、決まった会と調整中の会に分けるのに使う。
 * 参加者の URL でも見られる内容(決まった日とお店、答えた人数)だけを返す。なくなった会は返さない
 */
export async function partyStatuses(ids: string[]): Promise<Record<string, PartyStatus>> {
  const list = (Array.isArray(ids) ? ids : []).filter((id): id is string => typeof id === "string").slice(0, 30);
  const store = getStore();
  const rows = await Promise.all(
    list.map(async (id) => {
      const party = await store.getParty(id);
      if (!party) return null;
      const answers = await store.listAnswers(id);
      const going = party.decision ? summarize(party.dates, answers, party.decision.date).attendees.length : 0;
      return [id, { decision: party.decision, answered: answers.length, going }] as const;
    }),
  );
  return Object.fromEntries(rows.filter((r) => r !== null));
}

/**
 * 会計に、決まった会の行く人を読み込む。幹事の鍵(この端末に残っているもの)で確かめる。
 * 名前と、お酒を飲まないかだけを返す
 */
export async function partyAttendees(
  partyId: string,
  adminToken: string,
): Promise<{ title: string; date: string; attendees: { name: string; soft: boolean }[] } | null> {
  const store = getStore();
  const party = typeof partyId === "string" ? await store.getParty(partyId) : null;
  if (!party?.decision || !verifyToken(adminToken, party.adminHash)) return null;
  const summary = summarize(party.dates, await store.listAnswers(party.id), party.decision.date);
  return { title: party.title, date: party.decision.date, attendees: summary.attendees.map((a) => ({ name: a.name, soft: a.soft })) };
}
