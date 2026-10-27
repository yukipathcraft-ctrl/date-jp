import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AnswerPanel } from "@/components/AnswerPanel";
import { DecisionCard } from "@/components/DecisionCard";
import { NextHost } from "@/components/NextHost";
import { SecondPartyShops } from "@/components/SecondPartyShops";
import { SponsorSlot } from "@/components/SponsorSlot";
import { ShopList } from "@/components/ShopList";
import { SiteHeader } from "@/components/SiteHeader";
import { SummaryView } from "@/components/SummaryView";
import { getStore } from "@/lib/store";
import { dietNotice } from "@/lib/diet";
import { monthInJapan, nextOccasion } from "@/lib/invite";
import { clock } from "@/lib/sendai";
import { loadParty } from "@/lib/view";
import { PageMotion } from "@/components/PageMotion";

export async function generateMetadata(props: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const party = await getStore().getParty(id);
  if (!party) return { title: "飲み会が見つかりません" };
  const description = "行ける日と予算を30秒で答えてください";
  return { title: party.title, description, openGraph: { title: party.title, description } };
}

export default async function PartyPage(props: PageProps<"/p/[id]">) {
  await connection();
  const { id } = await props.params;
  const view = await loadParty(id);
  if (!view) notFound();
  const { party, summary, shops, otherArea } = view;
  // 答えた人を次の幹事に誘うときの、その時期の会の呼び方(忘年会・新歓など)
  const occasion = nextOccasion(monthInJapan(new Date()), party.audience);

  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl pb-16">
        <div className="px-4 pt-6 pb-4">
          <p className="text-sm font-bold text-muted">飲み会の日程とお店{party.start !== null ? ` ・ ${clock(party.start)}から` : ""}</p>
          <h1 className="mt-1 text-[22px] font-black tracking-tight">{party.title}</h1>
        </div>
        {party.decision && <DecisionCard decision={party.decision} />}
        <div>
          <AnswerPanel partyId={party.id} dates={party.dates} audience={party.audience} start={party.start} occasion={occasion} />
        </div>
        <div>
          <SummaryView summary={summary} />
        </div>
        <ShopList
          partyId={party.id}
          shops={shops}
          otherArea={otherArea}
          chosenId={party.decision?.shopId}
          notice={dietNotice(summary.diet)}
          basis={view.basis}
        />
        {/* お店まで決まったら、二次会のお店も出す */}
        {party.decision && (
          <>
            {/* 広告は会が決まったあとにだけ、会の種類に合うものを出す(lib/sponsors.ts に載せる会社がなければ出ない) */}
            <SponsorSlot placement="gift" audience={party.audience} />
            <SponsorSlot placement="second" audience={party.audience} />
            <SecondPartyShops partyId={party.id} />
            <SponsorSlot placement="ride" audience={party.audience} />
            <SponsorSlot placement="campus" audience={party.audience} />
          </>
        )}
        {/* 答えた人を、次の会の幹事にする */}
        <div>
          <NextHost occasion={occasion} />
        </div>
      </div>
    </PageMotion>
  );
}
