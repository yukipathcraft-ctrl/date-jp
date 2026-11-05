"use client";

import { Check, Cigarette, DoorClosed, MapPin, SlidersHorizontal, UtensilsCrossed, Wallet } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { findShops } from "@/app/actions";
import { AUDIENCES, isAdult, loadAudience, type Audience } from "@/lib/audience";
import { GENRES, yen, type GenreKey } from "@/lib/sendai";
import type { Shop } from "@/lib/shops";
import type { Station } from "@/lib/stations";
import { ShopList } from "./ShopList";
import { StationPicker } from "./StationPicker";
import { LABEL } from "./ui";

// お店を探す。条件を押すたびに、その場で絞りこむ(探すボタンは置かない)。
// 選択肢は横にすべらせず、折り返して全部見えるように並べる。場所は駅を1つ選ぶ(全国)。
// 料理はいくつでも選べる(印を四角にして、1つだけ選ぶ予算と見分ける)

function Option({
  on,
  onClick,
  title,
  note,
  compact,
  multi,
}: {
  on: boolean;
  onClick: () => void;
  title: React.ReactNode;
  note?: string;
  /** 3つ並べるときは丸の印を省き、文字を真ん中に寄せる */
  compact?: boolean;
  /** いくつでも選べる選択肢。印を四角にする */
  multi?: boolean;
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
          className={`grid size-5 shrink-0 place-items-center border ${multi ? "rounded-md" : "rounded-full"} ${on ? "border-accent-text" : "border-border"}`}
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
  // 駅は最初は選ばない(選ぶまではお店を出さない)
  const [station, setStation] = useState<Station | null>(null);
  const [genres, setGenres] = useState<GenreKey[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [privateRoom, setPrivateRoom] = useState(false);
  // 社会人の会は、上司がタバコを吸えるかどうかが大事なので、吸えるお店だけに絞れるようにする
  const [smoking, setSmoking] = useState(false);
  const [result, setResult] = useState<{ shops: Shop[]; otherArea: boolean; raisedTo: number | null } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const a = loadAudience() ?? "student";
    /* eslint-disable react-hooks/set-state-in-effect */
    setAudience(a);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 条件が変わるたびに探し直す
  useEffect(() => {
    if (!audience) return;
    if (!station) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(null);
      return;
    }
    start(async () => {
      setResult(await findShops({ station, genres, budget, privateRoom, smoking: audience !== null && isAdult(audience) && smoking, audience }));
    });
  }, [station, genres, budget, privateRoom, smoking, audience]);

  const toggleGenre = (k: GenreKey) =>
    setGenres((cur) => (cur.includes(k) ? cur.filter((g) => g !== k) : [...cur, k]));

  const opts = AUDIENCES[audience ?? "student"];
  const summary = [
    station ? `${station.name}駅` : "場所はまだ",
    budget === null ? "予算は決めない" : `${yen(budget)}まで`,
    genres.length > 0 ? genres.map((k) => GENRES.find((g) => g.key === k)!.label).join("・") : null,
    privateRoom ? "個室あり" : null,
    audience !== null && isAdult(audience) && smoking ? "喫煙できる" : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <>
      <div id="filters" className="mx-4 overflow-hidden rounded-3xl border panel">
        <fieldset className="border-b border-border px-4 py-5">
          <legend className="sr-only">場所</legend>
          <p className={LABEL} aria-hidden>
            <MapPin className="size-4" />
            どこで飲む?
          </p>
          <StationPicker value={station} onChange={setStation} anyLabel={null} />
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
            <span className="ml-auto text-xs font-normal">いくつでも選べます</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Option compact on={genres.length === 0} onClick={() => setGenres([])} title="なんでも" />
            {GENRES.map((g) => (
              <Option compact multi key={g.key} on={genres.includes(g.key)} onClick={() => toggleGenre(g.key)} title={g.label} />
            ))}
          </div>
        </fieldset>

        <div className="space-y-2 px-4 py-4">
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
          {audience !== null && isAdult(audience) && (
            <Option
              on={smoking}
              onClick={() => setSmoking(!smoking)}
              title={
                <span className="inline-flex items-center gap-1.5">
                  <Cigarette className="size-4" aria-hidden />
                  タバコが吸えるお店だけにする(分煙も含む)
                </span>
              }
            />
          )}
        </div>
      </div>

      {/* いまの条件と見つかった数を、結果の上に固定して出す */}
      <div className="sticky top-14 z-[5] mt-4 border-y border-border bg-bg/95 px-4 py-2.5 backdrop-blur" aria-live="polite">
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-bold">{summary}</span>
            <span className="block text-xs text-muted">
              {pending ? "検索中" : result ? `${result.shops.length}軒` : ""}
            </span>
          </p>
          <a href="#filters" className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold">
            <SlidersHorizontal className="size-3.5" aria-hidden />
            条件を変える
          </a>
        </div>
      </div>

      <div className={`mt-4 transition-opacity ${pending ? "opacity-50" : ""}`} aria-busy={pending}>
        {!station && (
          <p id="shops" className="mx-4 rounded-3xl border panel px-5 py-6 text-sm text-muted">
            上の「どこで飲む?」で駅を選ぶと、近くのお店を表示
          </p>
        )}
        {station && result &&
          (result.shops.length > 0 ? (
            <>
              {result.raisedTo !== null && budget !== null && (
                <p className="mx-4 mb-3 rounded-2xl border border-accent/50 bg-surface px-4 py-3 text-sm">
                  {yen(budget)}までのお店はなかったので、
                  {yen(result.raisedTo)}までのお店を表示中
                </p>
              )}
              <ShopList partyId="search" shops={result.shops} otherArea={result.otherArea} />
            </>
          ) : (
            <p id="shops" className="mx-4 rounded-3xl border panel px-5 py-6 text-sm text-muted">
              合うお店なし
            </p>
          ))}
      </div>
    </>
  );
}
