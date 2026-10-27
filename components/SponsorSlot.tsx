import type { Audience } from "@/lib/audience";
import type { Region } from "@/lib/region";
import { sponsorFor, type Placement } from "@/lib/sponsors";
import { SponsorCard } from "./SponsorCard";

/** 広告を1つ出す場所。会の種類に合う広告がなければ何も出さない。広告主は仙台の会社なので、仙台の会にだけ出す */
export function SponsorSlot({ placement, audience, region }: { placement: Placement; audience: Audience; region: Region }) {
  const sponsor = region ? null : sponsorFor(placement, audience);
  return sponsor ? <SponsorCard sponsor={sponsor} /> : null;
}
