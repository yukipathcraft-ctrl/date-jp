import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AdminPanel } from "@/components/AdminPanel";
import { DecisionCard } from "@/components/DecisionCard";
import { ShopList } from "@/components/ShopList";
import { SiteHeader } from "@/components/SiteHeader";
import { SummaryView } from "@/components/SummaryView";
import { verifyToken } from "@/lib/tokens";
import { loadParty } from "@/lib/view";

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
      <>
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-10">
          <h1 className="text-xl font-extrabold">幹事のURLが正しくありません</h1>
          <p className="mt-2 text-sm text-muted">作ったときに保存した、幹事用のURLから開いてください。</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-xl pb-16">
        <div className="px-4 pt-6 pb-4">
          <p className="text-sm font-bold text-muted">幹事の画面</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{party.title}</h1>
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
          attendees={summary.attendees.map((a) => a.name)}
        />
        <div className="mt-4">
          <SummaryView summary={summary} />
        </div>
        <ShopList partyId={party.id} shops={shops} otherArea={otherArea} chosenId={party.decision?.shopId} />
        <p className="px-4 pt-6 text-center text-sm">
          <a href={`/p/${party.id}`} className="font-bold underline">
            自分も回答する(みんなの画面へ)
          </a>
        </p>
      </div>
    </>
  );
}
