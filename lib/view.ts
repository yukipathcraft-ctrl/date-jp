import "server-only";
import { UNLIMITED_BUDGET } from "./sendai";
import { areaOptions } from "./hpAreas";
import type { AreaOption } from "./region";
import { searchShops, type Shop } from "./shops";
import { getStore } from "./store";
import type { Party } from "./store/types";
import { summarize, type Summary } from "./summary";

export type PartyView = {
  party: Omit<Party, "adminHash">;
  summary: Summary;
  shops: Shop[];
  otherArea: boolean;
  /** 回答で選ぶ「行きやすい場所」の選択肢(その会の地域のもの) */
  areas: AreaOption[];
};

/** 飲み会のページに出すもの。1人ずつの予算はここで落とし、ブラウザには渡さない */
export async function loadParty(id: string): Promise<(PartyView & { adminHash: string }) | null> {
  const store = getStore();
  const party = await store.getParty(id);
  if (!party) return null;
  const [answers, areas] = await Promise.all([store.listAnswers(id), areaOptions(party.region, party.audience)]);
  const summary = summarize(party.dates, answers, party.decision?.date, areas);
  const ready = summary.budget !== null && summary.area !== null;
  const { shops, otherArea } = ready
    ? await searchShops({
        area: summary.area!,
        // 全員が「上限なし」なら、予算で絞らない
        budget: summary.budget! >= UNLIMITED_BUDGET ? null : summary.budget!,
        size: summary.attendees.length,
        audience: party.audience,
        // タバコを吸う人がいれば、吸えるお店を先に出す
        ...(summary.diet.smokers > 0 ? { smoking: "prefer" as const } : {}),
      }, 10)
    : { shops: [], otherArea: false };
  const { adminHash, ...rest } = party;
  return { party: rest, adminHash, summary, shops, otherArea, areas };
}
