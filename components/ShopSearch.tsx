"use client";

import { Check, DoorClosed } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { findShops } from "@/app/actions";
import { AUDIENCES, loadAudience, type Audience } from "@/lib/audience";
import { AREAS, GENRES, yen, type AreaKey, type GenreKey } from "@/lib/sendai";
import type { Shop } from "@/lib/shops";
import { ShopList } from "./ShopList";
import { PILL, PILL_OFF, PILL_ON } from "./ui";

// お店だけ探す。条件を押すたびに、その場で絞りこむ(探すボタンは置かない)。
// 条件は上に固定した帯に横並びで置き、下の結果を見ながら選べるようにする

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`${PILL} min-h-10 shrink-0 px-3.5 ${on ? PILL_ON : PILL_OFF}`}
    >
      {on && <Check className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[11px] font-bold text-muted">{label}</span>
      <div className="-mr-4 flex gap-1.5 overflow-x-auto pr-4 pb-0.5 [scrollbar-width:none]">{children}</div>
    </div>
  );
}

export function ShopSearch() {
  const [audience, setAudience] = useState<Audience | null>(null);
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

  // 条件が変わるたびに探し直す
  useEffect(() => {
    if (!audience) return;
    start(async () => {
      setResult(await findShops({ area, genre, budget, privateRoom, audience }));
    });
  }, [area, genre, budget, privateRoom, audience]);

  const opts = AUDIENCES[audience ?? "student"];
  const areas = opts.areas.map((k) => AREAS.find((a) => a.key === k)!);

  return (
    <>
      <div className="sticky top-14 z-[5] border-y border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="space-y-2">
          <Row label="場所">
            {areas.map((a) => (
              <Chip key={a.key} on={area === a.key} onClick={() => setArea(a.key)}>
                {a.label}
              </Chip>
            ))}
          </Row>
          <Row label="予算">
            <Chip on={budget === null} onClick={() => setBudget(null)}>
              指定なし
            </Chip>
            {opts.budgets.map((b) => (
              <Chip key={b} on={budget === b} onClick={() => setBudget(b)}>
                〜{yen(b)}
              </Chip>
            ))}
          </Row>
          <Row label="料理">
            <Chip on={genre === null} onClick={() => setGenre(null)}>
              なんでも
            </Chip>
            {GENRES.map((g) => (
              <Chip key={g.key} on={genre === g.key} onClick={() => setGenre(g.key)}>
                {g.label}
              </Chip>
            ))}
          </Row>
          <Row label="個室">
            <Chip on={privateRoom} onClick={() => setPrivateRoom(!privateRoom)}>
              <DoorClosed className="size-3.5" aria-hidden />
              個室あり
            </Chip>
          </Row>
        </div>
      </div>

      <div className={`mt-4 transition-opacity ${pending ? "opacity-50" : ""}`} aria-busy={pending}>
        {result &&
          (result.shops.length > 0 ? (
            <ShopList partyId="search" shops={result.shops} otherArea={result.otherArea} />
          ) : (
            <p id="shops" className="mx-4 rounded-3xl border border-border bg-surface px-5 py-6 text-sm text-muted">
              合うお店が見つかりませんでした。予算や料理を広げてみてください。
            </p>
          ))}
      </div>
    </>
  );
}
