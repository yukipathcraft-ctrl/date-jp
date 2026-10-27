import type { Audience } from "@/lib/audience";
import { sponsorFor, type Placement } from "@/lib/sponsors";
import { SponsorCard } from "./SponsorCard";

/** 広告を1つ出す場所。会の種類に合う広告がなければ何も出さない */
export function SponsorSlot({ placement, audience }: { placement: Placement; audience: Audience }) {
  const sponsor = sponsorFor(placement, audience);
  return sponsor ? <SponsorCard sponsor={sponsor} /> : null;
}
