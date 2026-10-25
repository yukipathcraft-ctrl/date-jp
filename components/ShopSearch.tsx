"use client";

import { Check, DoorClosed, MapPin, SlidersHorizontal, UtensilsCrossed, Wallet } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { findShops } from "@/app/actions";
import { AUDIENCES, loadAudience, type Audience } from "@/lib/audience";
import { AREAS, GENRES, areaLabel, yen, type AreaKey, type GenreKey } from "@/lib/sendai";
import type { Shop } from "@/lib/shops";
import { ShopList } from "./ShopList";
import { LABEL } from "./ui";

// お店だけ探す。条件を押すたびに、その場で絞りこむ(探すボタンは置かない)。
// 選択肢は横にすべらせず、折り返して全部見えるように並べる。場所には「どんな所か」も添える

function Option({
  on,
  onClick,
  title,
  note,
  compact,
}: {
  on: boolean;
  onClick: () => void;
  title: React.ReactNode;
  note?: string;
  /** 3つ並べるときは丸の印を省き、文字を真ん中に寄せる */
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-12 items-center gap-2 rounded-2xl border py-2 transition-colors ${
        compact ? "justify-center px-1 text-center" : "px-3 text-left"
      } ${on ? "border-accent bg-accent text-accent-text" : "border-border bg-surface-2 text-text hover:border-muted"}`}
    >
      {compact ? (
        on && <Check className="size-3.5 shrink-0" aria-hidden />
      ) : (
        <span
          aria-hidden
          className={`grid size-5 shrink-0 place-items-center rounded-full border ${on ? "border-accent-text" : "border-border"}`}
        >
          {on && <Check className="size-3.5" />}
        </span>
      )}
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-bold whitespace-nowrap">{title}</span>
        {note && <span className={`block text-[11px] ${on ? "opacity-75" : "text-muted"}`}>{note}</span>}
      </span>
    </button>
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
  const summary = [
    areaLabel(area),
    budget === null ? "予算は決めない" : `${yen(budget)}まで`,
    genre ? GENRES.find((g) => g.key === genre)!.label : null,
    privateRoom ? "個室あり" : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <>
      <div id="filters" className="mx-4 overflow-hidden rounded-3xl border border-border bg-surface">
        <fieldset className="border-b border-border px-4 py-5">
          <legend className="sr-only">場所</legend>
          <p className={LABEL} aria-hidden>
            <MapPin className="size-4" />
            どこで飲む?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {areas.map((a) => (
              <Option key={a.key} on={area === a.key} onClick={() => setArea(a.key)} title={a.label} note={a.note} />
            ))}
          </div>
        </fieldset>

        <fieldset className="border-b border-border px-4 py-5">
          <legend className="sr-only">1人の予算</legend>
          <p className={LABEL} aria-hidden>
            <Wallet className="size-4" />
            1人いくらまで?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Option compact on={budget === null} onClick={() => setBudget(null)} title="決めない" />
            {opts.budgets.map((b) => (
              <Option compact key={b} on={budget === b} onClick={() => setBudget(b)} title={`〜${yen(b)}`} />
            ))}
          </div>
        </fieldset>

        <fieldset className="border-b border-border px-4 py-5">
          <legend className="sr-only">料理</legend>
          <p className={LABEL} aria-hidden>
            <UtensilsCrossed className="size-4" />
            何を食べる?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Option compact on={genre === null} onClick={() => setGenre(null)} title="なんでも" />
            {GENRES.map((g) => (
              <Option compact key={g.key} on={genre === g.key} onClick={() => setGenre(g.key)} title={g.label} />
            ))}
          </div>
        </fieldset>

        <div className="px-4 py-4">
          <Option
            on={privateRoom}
            onClick={() => setPrivateRoom(!privateRoom)}
            title={
              <span className="inline-flex items-center gap-1.5">
                <DoorClosed className="size-4" aria-hidden />
                個室があるお店だけにする
              </span>
            }
          />
        </div>
      </div>

      {/* いまの条件と見つかった数を、結果の上に固定して出す */}
      <div className="sticky top-14 z-[5] mt-4 border-y border-border bg-bg/95 px-4 py-2.5 backdrop-blur" aria-live="polite">
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-bold">{summary}</span>
            <span className="block text-xs text-muted">
              {pending ? "探しています" : result ? `${result.shops.length}軒見つかりました` : ""}
            </span>
          </p>
          <a href="#filters" className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold">
            <SlidersHorizontal className="size-3.5" aria-hidden />
            条件を変える
          </a>
        </div>
      </div>

      <div className={`mt-4 transition-opacity ${pending ? "opacity-50" : ""}`} aria-busy={pending}>
        {result &&
          (result.shops.length > 0 ? (
            <ShopList partyId="search" shops={result.shops} otherArea={result.otherArea} />
          ) : (
            <p id="shops" className="mx-4 rounded-3xl border border-border bg-surface px-5 py-6 text-sm text-muted">
              合うお店が見つからなかったので、予算や料理の条件をゆるめてみてください
            </p>
          ))}
      </div>
    </>
  );
}
