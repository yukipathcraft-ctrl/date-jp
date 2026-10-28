"use client";

import { CalendarDays, Copy, ExternalLink, MapPin, Store, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { partyStatuses, type PartyStatus } from "@/app/actions";
import { mapsUrl } from "@/lib/maps";
import { loadMyCollections, type MyCollection } from "@/lib/myCollections";
import { loadMyParties, type MyParty } from "@/lib/myParties";
import { clock, dateLabel, yen } from "@/lib/sendai";
import { BUTTON_PRIMARY } from "./ui";

// これまでの会の記録。この端末で作った会のうち、日にちまで決まった会を新しい順に並べ、
// 日にち・お店・人数・会計の額を見返せるようにする(毎年の歓迎会・忘年会を楽にするため)。
// 記録はサーバーに新しく残さず、この端末に残っている会の一覧と、会の今の様子から作る

type Row = { party: MyParty; status: PartyStatus; collection: MyCollection | null };

export function HistoryClient() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const mine = loadMyParties();
    if (mine.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows([]);
      return;
    }
    const collections = loadMyCollections();
    partyStatuses(mine.map((p) => p.id))
      .then((st) =>
        setRows(
          mine
            .filter((p) => st[p.id]?.decision)
            .map((p) => ({ party: p, status: st[p.id], collection: collections.find((c) => c.partyId === p.id) ?? null }))
            .sort((a, b) => b.status.decision!.date.localeCompare(a.status.decision!.date)),
        ),
      )
      .catch(() => setRows([]));
  }, []);

  if (rows === null) return <p className="px-4 text-sm text-muted">読み込んでいます…</p>;
  if (rows.length === 0) {
    return (
      <div className="px-4">
        <p className="rounded-3xl border panel px-5 py-6 text-sm text-muted">
          まだ記録はありません。この端末で作った会の日にちが決まると、ここに残ります
        </p>
        <Link href="/new" className={`${BUTTON_PRIMARY} mt-4 w-full`}>
          会をつくる
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3 px-4">
      {rows.map(({ party, status, collection }, i) => {
        const d = status.decision!;
        return (
          <li key={party.id} className="anim-stagger rounded-3xl border panel px-5 py-5" style={{ "--i": i } as React.CSSProperties}>
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <CalendarDays className="size-3.5" aria-hidden />
              {d.date.slice(0, 4)}年 {dateLabel(d.date)} {clock(d.start)}〜
            </p>
            <h2 className="mt-1 text-lg font-black">{party.title}</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-sm">
              <dt className="flex items-center gap-1 text-muted">
                <Store className="size-4" aria-hidden />
                お店
              </dt>
              <dd className="min-w-0">
                {d.shopName ? (
                  <a href={mapsUrl(d.shopName)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-bold underline-offset-2 hover:underline">
                    {d.shopName}
                    <MapPin className="size-3.5 shrink-0 text-muted" aria-hidden />
                  </a>
                ) : (
                  <span className="text-muted">決めていません</span>
                )}
              </dd>
              <dt className="flex items-center gap-1 text-muted">
                <Users className="size-4" aria-hidden />
                人数
              </dt>
              <dd className="font-bold">{status.going}人</dd>
              <dt className="flex items-center gap-1 text-muted">
                <Wallet className="size-4" aria-hidden />
                会計
              </dt>
              <dd>
                {collection ? (
                  <Link href={`/c/${collection.id}?token=${collection.token}`} className="font-bold underline-offset-2 hover:underline">
                    {yen(collection.total)}
                    {status.going > 0 && <span className="ml-1 text-xs font-normal text-muted">(1人あたり {yen(Math.round(collection.total / status.going))})</span>}
                  </Link>
                ) : (
                  <span className="text-muted">記録なし</span>
                )}
              </dd>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href={`/new?title=${encodeURIComponent(party.title)}`}
                className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-accent/10 text-sm font-bold text-accent ring-1 ring-accent/50"
              >
                <Copy className="size-4" aria-hidden />
                この会をもとに作る
              </Link>
              <Link
                href={`/p/${party.id}/admin?token=${party.token}`}
                className="flex min-h-11 items-center justify-center gap-1 rounded-xl text-sm font-bold ring-1 ring-white/15"
              >
                会のページ
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
