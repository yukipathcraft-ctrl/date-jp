import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AdminPanel } from "@/components/AdminPanel";
import { DecisionCard } from "@/components/DecisionCard";
import { SecondPartyShops } from "@/components/SecondPartyShops";
import { SponsorSlot } from "@/components/SponsorSlot";
import { ShopList } from "@/components/ShopList";
import { SiteHeader } from "@/components/SiteHeader";
import { StepBar } from "@/components/StepBar";
import { SummaryView } from "@/components/SummaryView";
import { verifyToken } from "@/lib/tokens";
import { dietNotice } from "@/lib/diet";
import { loadParty } from "@/lib/view";
import { PageMotion } from "@/components/PageMotion";

export const metadata: Metadata = { title: "幹事の画面", robots: { index: false } };

export default async function AdminPage(props: PageProps<"/p/[id]/admin">) {
  await connection();
  const { id } = await props.params;
  const { token, created } = await props.searchParams;
  const view = await loadParty(id);
  if (!view) notFound();
  const { party, summary, shops, otherArea, adminHash } = view;

  if (typeof token !== "string" || !verifyToken(token, adminHash)) {
    return (
      <PageMotion>
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-10">
          <h1 className="text-xl font-black">幹事のURLが正しくありません</h1>
          <p className="mt-2 text-sm text-muted">会を作ったときに保存した幹事用のURLから開いてください</p>
        </div>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      {/* 日にちが決まるまでは「日程調整」、決まったら「お店探し」 */}
      <SiteHeader>
        <StepBar current={party.decision ? 1 : 0} />
      </SiteHeader>
      <div className="mx-auto max-w-xl pb-16">
        <div className="px-4 pt-6 pb-4">
          <p className="text-[11px] font-black tracking-[0.2em] text-stone-400">幹事の画面</p>
          <h1 className="mt-1 text-[22px] font-black tracking-tight">{party.title}</h1>
        </div>
        {party.decision && (
          <div className="mb-4">
            <DecisionCard decision={party.decision} />
          </div>
        )}
        <AdminPanel
          partyId={party.id}
          title={party.title}
          token={token}
          created={created === "1"}
          ranking={summary.ranking}
          bestDate={summary.date}
          shops={shops}
          decision={party.decision}
          attendees={summary.attendees.map((a) => ({ name: a.name, soft: a.soft }))}
          audience={party.audience}
        />
        <div className="mt-4">
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
        <p className="px-4 pt-6 text-center text-sm">
          <a href={`/p/${party.id}`} className="font-bold underline">
            自分も回答する(みんなの画面へ)
          </a>
        </p>
      </div>
    </PageMotion>
  );
}
