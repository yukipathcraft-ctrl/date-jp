"use client";

import { Check, DoorClosed, MapPin, UtensilsCrossed, Wallet } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { findShops } from "@/app/actions";
import { AUDIENCES, loadAudience, type Audience } from "@/lib/audience";
import { AREAS, GENRES, yen, type AreaKey, type GenreKey } from "@/lib/sendai";
import type { Shop } from "@/lib/shops";
import { ShopList } from "./ShopList";
import { BUTTON_PRIMARY, LABEL, PILL, PILL_OFF, PILL_ON } from "./ui";

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}>
      {on && <Check className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}

export function ShopSearch() {
  const [audience, setAudience] = useState<Audience>("student");
  const [area, setArea] = useState<AreaKey>("station");
  const [genre, setGenre] = useState<GenreKey | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [result, setResult] = useState<{ shops: Shop[]; otherArea: boolean } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const a = loadAudience() ?? "student";
    /* eslint-disable react-hooks/set-state-in-effect */
    setAudience(a);
    setArea(AUDIENCES[a].areas[0]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const areas = AUDIENCES[audience].areas.map((k) => AREAS.find((a) => a.key === k)!);

  function search() {
    start(async () => {
      setResult(await findShops({ area, genre, budget, privateRoom, audience }));
      requestAnimationFrame(() => document.getElementById("shops")?.scrollIntoView({ behavior: "smooth" }));
    });
  }

  return (
    <>
      <div className="mx-4 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-5">
          <p className={LABEL}>
            <MapPin className="size-4" aria-hidden />
            エリア
          </p>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <Pill key={a.key} on={area === a.key} onClick={() => setArea(a.key)}>
                {a.label}
              </Pill>
            ))}
          </div>
        </div>
        <div className="border-b border-border px-5 py-5">
          <p className={LABEL}>
            <UtensilsCrossed className="size-4" aria-hidden />
            ジャンル <span className="font-normal">(任意)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Pill key={g.key} on={genre === g.key} onClick={() => setGenre(genre === g.key ? null : g.key)}>
                {g.label}
              </Pill>
            ))}
          </div>
        </div>
        <div className="border-b border-border px-5 py-5">
          <p className={LABEL}>
            <Wallet className="size-4" aria-hidden />
            1人の予算
          </p>
          <div className="flex flex-wrap gap-2">
            <Pill on={budget === null} onClick={() => setBudget(null)}>
              指定なし
            </Pill>
            {AUDIENCES[audience].budgets.map((b) => (
              <Pill key={b} on={budget === b} onClick={() => setBudget(b)}>
                〜{yen(b)}
              </Pill>
            ))}
          </div>
        </div>
        <div className="px-5 py-5">
          <p className={LABEL}>
            <DoorClosed className="size-4" aria-hidden />
            個室
          </p>
          <div className="flex flex-wrap gap-2">
            <Pill on={!privateRoom} onClick={() => setPrivateRoom(false)}>
              どちらでも
            </Pill>
            <Pill on={privateRoom} onClick={() => setPrivateRoom(true)}>
              あり
            </Pill>
          </div>
        </div>
      </div>

      <div className="px-4">
        <button type="button" onClick={search} disabled={pending} className={`${BUTTON_PRIMARY} mt-6 w-full`}>
          {pending ? "探しています…" : "この条件でお店を探す"}
        </button>
      </div>

      {result &&
        (result.shops.length > 0 ? (
          <div className="mt-6">
            <ShopList partyId="search" shops={result.shops} otherArea={result.otherArea} />
          </div>
        ) : (
          <p id="shops" className="mx-4 mt-6 rounded-3xl border border-border bg-surface px-5 py-6 text-sm text-muted">
            合うお店が見つかりませんでした。予算やジャンルを広げてみてください。
          </p>
        ))}
    </>
  );
}
