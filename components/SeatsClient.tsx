"use client";

import { Crown, ListOrdered, RectangleHorizontal, Circle, Shuffle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { isFormal, loadAudience } from "@/lib/audience";
import { assignSeats, parseNames, rankSeats, seatsText, type Person } from "@/lib/seats";
import { SendButtons, useCanShare } from "./SendButtons";
import { BUTTON_PRIMARY, BUTTON_SUB, CARD, INPUT, LABEL, PILL, PILL_OFF, PILL_ON } from "./ui";

const TABLE_CHOICES = [1, 2, 3, 4, 5, 6];

// 混ぜたいグループ。色は globals.css の .tier-*。色だけで区別しないよう、必ず A・B・C の字を添える
const GROUPS = [
  { key: "A", tone: "blue" },
  { key: "B", tone: "green" },
  { key: "C", tone: "purple" },
] as const;
const toneOf = (g?: string) => GROUPS.find((x) => x.key === g)?.tone;

type Shape = "round" | "long";
/** lottery = くじで決める、rank = 役職の順に上座から(会社の飲み会) */
type Mode = "lottery" | "rank";
type Meta = { honored: boolean; group?: string };

/**
 * 席に座っている人。主役は金の地に冠、グループの人は色の縁と A・B・C の字。
 * fill = 長テーブルの1マスいっぱいに広げる、compact = 丸テーブルに人が多いときに小さくする
 */
function Seat({ p, index, fill, compact }: { p: Person; index: number; fill?: boolean; compact?: boolean }) {
  // 役職の順で決めたときは、そのテーブルの上座からの順番(1 が上座)を添える
  const order = p.rank ? index + 1 : null;
  const tone = toneOf(p.group);
  return (
    <span
      className={`anim-stagger inline-flex items-center justify-center gap-1 rounded-full py-1.5 leading-none font-bold ${
        fill ? "w-full max-w-full px-1.5 text-[12px]" : compact ? "max-w-[4.25rem] px-2 text-[11px]" : "max-w-[5.5rem] px-2.5 text-[12px]"
      } shadow-[0_4px_12px_-4px_rgb(0_0_0/0.6)] ${
        p.honored
          ? "bg-accent text-accent-text"
          : tone
            ? `tier-${tone} bg-[var(--ts)] text-[var(--tc)] ring-1 ring-[var(--tb)]`
            : "bg-surface-2 text-white ring-1 ring-white/15"
      }`}
      style={{ "--i": index } as React.CSSProperties}
    >
      {p.honored && <Crown className="size-3 shrink-0" aria-label="主役" />}
      {order && (
        <span className={`grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-black ${order === 1 ? "bg-accent text-accent-text" : "bg-white/15"}`}>
          {order}
        </span>
      )}
      <span className="truncate">{p.name}</span>
      {p.group && !p.honored && <span className="shrink-0 text-[10px] font-black opacity-80">{p.group}</span>}
    </span>
  );
}

/** 丸テーブル。いちばん上の席が上座で、時計回りに座る */
function RoundTable({ people, no }: { people: Person[]; no: number }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[19rem]">
      <div className="absolute inset-[24%] grid place-items-center rounded-full bg-white/5 ring-1 ring-white/12">
        <span className="text-center">
          <span className="block text-[22px] font-black">{no}卓</span>
          <span className="block text-[10px] font-bold text-white/40">{people.length}人</span>
        </span>
      </div>
      {people.map((p, i) => {
        const a = (i / people.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${50 + 40 * Math.cos(a)}%`, top: `${50 + 40 * Math.sin(a)}%` }}
          >
            <Seat p={p} index={i} compact={people.length > 8} />
          </div>
        );
      })}
    </div>
  );
}

/** 長テーブル。左の奥が上座で、上の列と下の列に交互に座る(向かい合わせ) */
function LongTable({ people, no }: { people: Person[]; no: number }) {
  const top = people.filter((_, i) => i % 2 === 0);
  const bottom = people.filter((_, i) => i % 2 === 1);
  const cols = Math.max(1, top.length);
  const row = (list: Person[], offset: number) => (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {list.map((p, i) => (
        <div key={i} className="flex min-w-0 justify-center">
          <Seat p={p} index={i * 2 + offset} fill />
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-2">
      {/* 左が奥(上座)、右が入口。どちらが上座かを文字で示す */}
      <div className="flex justify-between px-1 text-[10px] font-bold text-white/40">
        <span>← 奥(上座)</span>
        <span>入口 →</span>
      </div>
      {row(top, 0)}
      <div className="grid h-12 place-items-center rounded-xl bg-white/5 ring-1 ring-white/12">
        <span className="text-[13px] font-black">
          {no}卓 <span className="text-[10px] font-bold text-white/40">{people.length}人</span>
        </span>
      </div>
      {row(bottom, 1)}
    </div>
  );
}

/** オプションの切り替え。押すと下に名前の一覧が開く */
function Toggle({ on, onClick, icon, title, sub }: { on: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition active:scale-[0.99] ${
        on ? "bg-accent/10 ring-accent/60" : "bg-white/5 ring-white/12 hover:bg-white/8"
      }`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${on ? "bg-accent text-accent-text" : "bg-white/8 text-white/60"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-black">{title}</span>
        <span className="block text-[11px] text-white/40">{sub}</span>
      </span>
      <span
        aria-hidden
        className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${on ? "justify-end bg-accent" : "justify-start bg-white/15"}`}
      >
        <span className="size-5 rounded-full bg-white" />
      </span>
    </button>
  );
}

export function SeatsClient() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("lottery");
  // 役職の順は会社の会だけの機能。会社を選んでいる人には、はじめから役職の順にしておく
  const [company, setCompany] = useState(false);
  useEffect(() => {
    const a = loadAudience();
    if (a && isFormal(a)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setCompany(true);
      setMode("rank");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);
  const [tables, setTables] = useState(2);
  // 居酒屋の宴会は長テーブルが多いので、最初は長テーブル
  const [shape, setShape] = useState<Shape>("long");
  const [useHonored, setUseHonored] = useState(false);
  const [useGroups, setUseGroups] = useState(false);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [result, setResult] = useState<Person[][] | null>(null);
  // 引き直すたびに数を変え、席の出てくる動きをもう一度流す
  const [draw, setDraw] = useState(0);
  const canShare = useCanShare();

  const names = parseNames(text);
  const ready = names.length >= 2;
  const people: Person[] = names.map((name) => ({
    name,
    honored: useHonored && meta[name]?.honored === true,
    group: useGroups ? meta[name]?.group : undefined,
  }));

  const patch = (name: string, p: Partial<Meta>) =>
    setMeta((m) => ({ ...m, [name]: { ...(m[name] ?? { honored: false }), ...p } }));

  function run() {
    setResult(mode === "rank" ? rankSeats(names, tables) : assignSeats(people, tables));
    setDraw((d) => d + 1);
  }

  return (
    <div className="space-y-4">
      <section className={`${CARD} space-y-6 px-5 py-5`}>
        {company && (
        <div>
          <p className={LABEL}>席の決め方</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="席の決め方">
            {(
              [
                { key: "lottery", label: "くじで決める", Icon: Shuffle },
                { key: "rank", label: "役職の順に", Icon: ListOrdered },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => {
                  setMode(key);
                  setResult(null);
                }}
                className={`${PILL} justify-center gap-2 ${mode === key ? PILL_ON : PILL_OFF}`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          {mode === "rank" && <p className="mt-2 text-xs text-muted">偉い人から順に名前を入れて上座から配置</p>}
        </div>
        )}

        <label className="block">
          <span className={LABEL}>
            <Users className="size-4" aria-hidden />
            来る人の名前 <span className="font-normal">{mode === "rank" ? "(偉い人から順に、1行に1人)" : "(1行に1人)"}</span>
          </span>
          <textarea
            className={`${INPUT} min-h-36 resize-none py-3 leading-relaxed`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === "rank" ? "部長\n課長\n山田\n佐藤" : "山田\n佐藤\n鈴木"}
          />
          <span className="mt-2 block text-xs text-muted">{names.length}人</span>
        </label>

        <div>
          <p className={LABEL}>テーブルの形</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="テーブルの形">
            {(
              [
                { key: "long", label: "長テーブル", Icon: RectangleHorizontal },
                { key: "round", label: "丸テーブル", Icon: Circle },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={shape === key}
                onClick={() => setShape(key)}
                className={`${PILL} justify-center gap-2 ${shape === key ? PILL_ON : PILL_OFF}`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={LABEL}>テーブルの数</p>
          <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="テーブルの数">
            {TABLE_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={tables === n}
                onClick={() => setTables(n)}
                className={`${PILL} justify-center px-0 ${tables === n ? PILL_ON : PILL_OFF}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {mode === "lottery" && (
        <div className="space-y-2">
          <Toggle
            on={useHonored}
            onClick={() => setUseHonored((v) => !v)}
            icon={<Crown className="size-4" aria-hidden />}
            title="主役を上座にする"
            sub="送別会の主役や上司を、奥の席に"
          />
          <Toggle
            on={useGroups}
            onClick={() => setUseGroups((v) => !v)}
            icon={<Shuffle className="size-4" aria-hidden />}
            title="グループを混ぜる"
            sub="学年や部署が同じ人を、別のテーブルに"
          />
          {(useHonored || useGroups) && names.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {names.map((name, i) => {
                const m = meta[name];
                return (
                  <li key={i} className="flex items-center gap-2 rounded-xl bg-white/4 py-1 pr-1 pl-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{name}</span>
                    {useHonored && (
                      <button
                        type="button"
                        aria-pressed={m?.honored === true}
                        aria-label={`${name}さんを主役にする`}
                        onClick={() => patch(name, { honored: !m?.honored })}
                        className={`grid size-10 place-items-center rounded-lg transition ${
                          m?.honored ? "bg-accent text-accent-text" : "text-white/30 hover:text-white/60"
                        }`}
                      >
                        <Crown className="size-4" aria-hidden />
                      </button>
                    )}
                    {useGroups && (
                      <span className="flex gap-1" role="group" aria-label={`${name}さんのグループ`}>
                        {GROUPS.map((g) => {
                          const on = m?.group === g.key;
                          return (
                            <button
                              key={g.key}
                              type="button"
                              aria-pressed={on}
                              onClick={() => patch(name, { group: on ? undefined : g.key })}
                              className={`tier-${g.tone} grid size-10 place-items-center rounded-lg text-xs font-black transition ${
                                on ? "bg-[var(--tb)] text-black" : "text-white/35 ring-1 ring-white/10 hover:text-white/60"
                              }`}
                            >
                              {g.key}
                            </button>
                          );
                        })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}
      </section>

      <div className="px-4">
        <button type="button" disabled={!ready} onClick={run} className={`${BUTTON_PRIMARY} w-full gap-2`}>
          {mode === "rank" ? <ListOrdered className="size-5" aria-hidden /> : <Shuffle className="size-5" aria-hidden />}
          {!ready ? "名前を2人以上入れてください" : mode === "rank" ? "上座から順に並べる" : result ? "もう一度くじを引く" : "くじで席を決める"}
        </button>
      </div>

      {result && (
        <section key={draw} className="space-y-3 px-4" aria-live="polite">
          {result.map((t, i) => (
            <div key={i} className="rounded-3xl bg-surface px-3 py-5 ring-1 ring-white/8">
              {shape === "round" ? <RoundTable people={t} no={i + 1} /> : <LongTable people={t} no={i + 1} />}
            </div>
          ))}
          {mode === "rank" && <p className="text-center text-[11px] text-white/40">数字はテーブルごとの上座からの順番</p>}
          {mode === "lottery" && (useHonored || useGroups) && (
            <p className="text-center text-[11px] text-white/40">
              {useHonored && "冠が主役の席(上座)"}
              {useHonored && useGroups && "・"}
              {useGroups && "A・B・C はグループ"}
            </p>
          )}
          {/* 学生も社会人も、共有のボタンひとつで送る(送り先はスマホの共有の画面で選ぶ) */}
          <SendButtons mainLabel="共有して席を送る" share={{ text: seatsText(result) }} copy={seatsText(result)} copyLabel="席の文をコピー" canShare={canShare} />
          <button type="button" onClick={() => setResult(null)} className={`${BUTTON_SUB} w-full`}>
            名前を直す
          </button>
        </section>
      )}
    </div>
  );
}
