import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AnswerPanel } from "@/components/AnswerPanel";
import { DecisionCard } from "@/components/DecisionCard";
import { NextHost } from "@/components/NextHost";
import { SecondPartyShops } from "@/components/SecondPartyShops";
import { ShopList } from "@/components/ShopList";
import { SiteHeader } from "@/components/SiteHeader";
import { SummaryView } from "@/components/SummaryView";
import { getStore } from "@/lib/store";
import { dietNotice } from "@/lib/diet";
import { loadParty } from "@/lib/view";
import { PageMotion } from "@/components/PageMotion";

export async function generateMetadata(props: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const party = await getStore().getParty(id);
  if (!party) return { title: "飲み会が見つかりません" };
  const description = "行ける日・予算・何時まで残れるかを30秒で答えてください";
  return { title: party.title, description, openGraph: { title: party.title, description } };
}

export default async function PartyPage(props: PageProps<"/p/[id]">) {
  await connection();
  const { id } = await props.params;
  const view = await loadParty(id);
  if (!view) notFound();
  const { party, summary, shops, otherArea } = view;

  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl pb-16">
        <div className="px-4 pt-6 pb-4">
          <p className="text-sm font-bold text-muted">飲み会の日程とお店</p>
          <h1 className="mt-1 text-[22px] font-black tracking-tight">{party.title}</h1>
        </div>
        {party.decision && <DecisionCard decision={party.decision} />}
        <div className={party.decision ? "mt-4" : ""}>
          <AnswerPanel partyId={party.id} dates={party.dates} audience={party.audience} />
        </div>
        <div className="mt-4">
          <SummaryView summary={summary} />
        </div>
        <ShopList
          partyId={party.id}
          shops={shops}
          otherArea={otherArea}
          chosenId={party.decision?.shopId}
          notice={dietNotice(summary.diet)}
        />
        {/* お店まで決まったら、二次会のお店も出す */}
        {party.decision && <SecondPartyShops partyId={party.id} />}
        {/* 答えた人を、次の会の幹事にする */}
        <div className="mx-4 mt-4">
          <NextHost />
        </div>
      </div>
    </PageMotion>
  );
}
