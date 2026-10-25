import "server-only";
import { searchShops, type Shop } from "./shops";
import { getStore } from "./store";
import type { Party } from "./store/types";
import { summarize, type Summary } from "./summary";

export type PartyView = {
  party: Omit<Party, "adminHash">;
  summary: Summary;
  shops: Shop[];
  otherArea: boolean;
};

/** 飲み会のページに出すもの。1人ずつの予算はここで落とし、ブラウザには渡さない */
export async function loadParty(id: string): Promise<(PartyView & { adminHash: string }) | null> {
  const store = getStore();
  const party = await store.getParty(id);
  if (!party) return null;
  const answers = await store.listAnswers(id);
  const summary = summarize(party.dates, answers, party.decision?.date);
  const ready = summary.budget !== null && summary.area !== null;
  const { shops, otherArea } = ready
    ? await searchShops({
        area: summary.area!,
        budget: summary.budget!,
        size: summary.attendees.length,
        audience: party.audience,
      })
    : { shops: [], otherArea: false };
  const { adminHash, ...rest } = party;
  return { party: rest, adminHash, summary, shops, otherArea };
}
