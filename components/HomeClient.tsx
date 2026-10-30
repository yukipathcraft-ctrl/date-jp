"use client";

import { ArrowRight, Beer, Briefcase, CalendarDays, ChevronDown, ChevronRight, CircleCheck, Clock, GraduationCap, Hourglass, ListChecks, MapPin, Shuffle, Store, Wallet, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { partyStatuses, type PartyStatus } from "@/app/actions";
import { AUDIENCES, AUDIENCE_ORDER, loadAudience, saveAudience, type Audience } from "@/lib/audience";
import { loadMyParties, type MyParty } from "@/lib/myParties";
import { clock, dateLabel } from "@/lib/sendai";
import { WEIGHTS } from "@/lib/split";
import { Wordmark } from "./Logo";
import { SplashIntro } from "./SplashIntro";
import { SECTION_LABEL } from "./ui";


type Phase = "loading" | "splash" | "choose" | "home";

/** ホームの行。もとにした KANJI の「完了済みの会を見る」と同じ、白8%の縁の横長の行 */
function HomeRow({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 ring-1 ring-white/8 transition hover:bg-stone-800 active:scale-[0.99]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 text-accent">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black tracking-tight text-white/85">{title}</span>
        <span className="mt-0.5 block truncate text-[10px] text-white/35">{sub}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/30" aria-hidden />
    </Link>
  );
}

/** ツールの四角。もとにした KANJI の「お店を探す」「会計を試算する」と同じ、2つ並べる大きめの四角 */
function ToolTile({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-3 py-5 text-center ring-1 ring-white/8 transition hover:bg-stone-800 active:scale-95"
    >
      <span className="grid size-12 place-items-center rounded-xl border border-accent/40 text-accent">{icon}</span>
      <span>
        <span className="block text-[13px] font-black tracking-tight text-white/85">{title}</span>
        <span className="mt-0.5 block text-[10px] text-white/35">{sub}</span>
      </span>
    </Link>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <h2 className={`${SECTION_LABEL} mb-3`}>
      <span className="text-stone-500">{icon}</span>
      {children}
    </h2>
  );
}


/** 「調整中」「決まった」の1かたまり。場所をとらないよう、最初は2件だけ出し、残りは押すと開く */
function PartyGroup({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { party: MyParty; icon: React.ReactNode; sub: string }[];
}) {
  const [all, setAll] = useState(false);
  return (
    <section>
      <SectionTitle icon={icon}>
        {title} <span className="tracking-normal text-stone-500">{items.length}</span>
      </SectionTitle>
      <div className="space-y-2">
        {(all ? items : items.slice(0, 2)).map(({ party: p, icon: rowIcon, sub }) => (
          <HomeRow key={p.id} href={`/p/${p.id}/admin?token=${p.token}`} icon={rowIcon} title={p.title} sub={sub} />
        ))}
      </div>
      {!all && items.length > 2 && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mt-2 min-h-11 w-full text-xs font-bold text-white/40 underline underline-offset-2 hover:text-white/60"
        >
          ほかの{items.length - 2}件も見る
        </button>
      )}
    </section>
  );
}

/**
 * 学生・プライベート・会社で変えるところ。見出しの一言、2つの道具の説明、その下の小さな道具。
 * 会社だけの道具(経費精算・役職の順の席次)は、会社のときだけ出す
 */
const HOME_BY_AUDIENCE: Record<
  Audience,
  { lead: string; shops: string; split: string; extras: { href: string; label: string; sub: string; icon: "collect" | "seats" }[] }
> = {
  student: {
    lead: "サークル・ゼミの飲み会を、URLひとつで",
    shops: "学割・飲み放題のお店",
    split: "先輩多めの傾斜も割り勘も",
    extras: [
      { href: "/collect", label: "集金のチェック", sub: "誰が払ったかを確かめる", icon: "collect" },
      { href: "/seats", label: "席をくじで決める", sub: "くじで公平に", icon: "seats" },
    ],
  },
  private: {
    lead: "友達との飲み会を、URLひとつで",
    shops: "飲み放題・個室のお店",
    split: "割り勘も、年上多めも",
    extras: [
      { href: "/collect", label: "集金のチェック", sub: "誰が払ったかを確かめる", icon: "collect" },
      { href: "/seats", label: "席をくじで決める", sub: "くじで公平に", icon: "seats" },
    ],
  },
  worker: {
    lead: "歓送迎会・忘年会を、URLひとつで",
    shops: "個室・喫煙できるお店も",
    split: "会社の補助も、上司多めも",
    extras: [
      { href: "/collect", label: "集金・経費精算", sub: "名簿と金額をそのまま", icon: "collect" },
      { href: "/seats", label: "役職の順に席次", sub: "上座から順に", icon: "seats" },
    ],
  },
};

/** トップの見出しの下に並べる、みんなの答えから決まるもの */
const HERO_ITEMS = [
  { Icon: CalendarDays, label: "日にち" },
  { Icon: Clock, label: "時間" },
  { Icon: Wallet, label: "予算" },
  { Icon: MapPin, label: "お店" },
] as const;

/**
 * 乾杯の演出を、アプリを開いたこの回にもう出したか。ページを読み込み直すと false に戻るので、
 * 起動したときだけ出て、アプリの中でトップに戻ってきたときは出ない
 */
let introPlayed = false;

/** 起動画面 → 学生・プライベート・会社のどれか → ホーム。起動画面はアプリを開いたときだけ出す(タップで飛ばせる) */
export function HomeClient() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [audience, setAudience] = useState<Audience | null>(null);
  const [parties, setParties] = useState<MyParty[]>([]);
  // 会ごとの、決まったかどうかと答えた人数。読み終えるまでは「あなたの会」を出さない
  const [statuses, setStatuses] = useState<Record<string, PartyStatus> | null>(null);
  // 日本時間の今日(終わった会かどうかに使う)。描画のたびに時計を読まないよう、開いたときに決める
  const [today, setToday] = useState("");

  useEffect(() => {
    // localStorage はブラウザでしか読めないので、描画のあとで読む
    const saved = loadAudience();
    /* eslint-disable react-hooks/set-state-in-effect */
    setAudience(saved);
    setToday(new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const mine = loadMyParties();
    setParties(mine);
    if (mine.length > 0) {
      partyStatuses(mine.map((p) => p.id))
        .then(setStatuses)
        .catch(() => setStatuses({}));
    }
    // 起動の演出は、アプリを開いたときだけ出す(戻ってきたときはすぐにホーム)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next: Phase = saved ? "home" : "choose";
    if (reduce || introPlayed) {
      setPhase(next);
      return;
    }
    setPhase("splash");
    /* eslint-enable react-hooks/set-state-in-effect */
    // 出し終えてから「出した」にする(開発中に効果が2回走っても、演出は1回きちんと出る)
    const t = setTimeout(() => {
      introPlayed = true;
      setPhase(next);
    }, 3200);
    return () => clearTimeout(t);
  }, []);

  function choose(a: Audience) {
    saveAudience(a);
    setAudience(a);
    setPhase("home");
  }

  if (phase === "loading") return <div className="min-h-dvh bg-bg" />;

  if (phase === "splash") {
    return (
      <SplashIntro
        onSkip={() => {
          introPlayed = true;
          setPhase(audience ? "home" : "choose");
        }}
      />
    );
  }

  if (phase === "choose" || audience === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-10">
        <div className="anim-rise">
          <Wordmark size={40} />
          <h1 className="mt-6 text-3xl font-black tracking-tight">あなたは?</h1>
          {/* 375px 幅でもきれいに2行で収まるよう、行の切れ目を決めておく */}
          <p className="mt-2 text-muted">
            <span className="block">選んだものに合う予算・時間・お店を表示</span>
            <span className="block">あとから切り替えOK</span>
          </p>
          <div className="mt-8 grid gap-3">
            {AUDIENCE_ORDER.map((a) => {
              const Icon = { student: GraduationCap, private: Beer, worker: Briefcase }[a];
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => choose(a)}
                  className="flex min-h-24 items-center gap-4 rounded-3xl border panel px-5 text-left transition-colors hover:border-accent"
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-accent/60 text-accent">
                    <Icon className="size-7" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-black tracking-tight">{AUDIENCES[a].label}</span>
                    <span className="block text-[11px] text-white/40">{AUDIENCES[a].note}</span>
                  </span>
                  <ChevronRight className="size-5 text-muted" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const tiers = WEIGHTS[audience];
  const known = statuses ? parties.filter((p) => statuses[p.id]) : [];
  const home = HOME_BY_AUDIENCE[audience];
  // 調整中の会を先に、次にこれからの会を日が近い順に。終わった会は「これまでの会」に回す
  const active = [
    ...known.filter((p) => !statuses![p.id].decision),
    ...known
      .filter((p) => statuses![p.id].decision && statuses![p.id].decision!.date >= today)
      .sort((x, y) => statuses![x.id].decision!.date.localeCompare(statuses![y.id].decision!.date)),
  ];
  const past = known.filter((p) => statuses![p.id].decision && statuses![p.id].decision!.date < today).length;
  const tierIcon = (
    // 傾斜の区分の色を、高さの違う棒で並べる(多めの人ほど高い)
    <span aria-hidden className="flex h-6 items-end gap-[3px]">
      {tiers.map((w) => (
        <span
          key={w.key}
          className={`tier-${w.tone} w-[5px] rounded-full bg-[var(--tb)]`}
          style={{ height: `${Math.round((w.tenths / 15) * 100)}%` }}
        />
      ))}
    </span>
  );

  return (
    <div className="anim-rise mx-auto max-w-xl space-y-5 px-4 pt-6 pb-16">
      {/* いちばん上: 名前と、学生・プライベート・会社。隅に小さく置き、押すと選び直す画面を開く */}
      <div className="flex items-center justify-between pt-2">
        <Wordmark size={26} />
        <button
          type="button"
          onClick={() => setPhase("choose")}
          aria-label={`学生・プライベート・会社を選び直す(いまは${AUDIENCES[audience].label})`}
          className="-mr-1 flex h-9 items-center gap-1 rounded-full px-3 text-[12px] font-bold text-white/70 ring-1 ring-white/20 transition hover:text-white hover:ring-white/40 active:scale-95"
        >
          {AUDIENCES[audience].label}
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* 会をつくる。ここだけ金の光をまとわせ、日にち・時間・予算・お店が決まる流れを見せる */}
      <Link href="/new" className="hero block overflow-hidden rounded-3xl transition active:scale-[0.99]">
        <div className="flex flex-col px-6 pt-7 pb-6">
          <ul className="flex items-end justify-center" aria-label="みんなの答えから決まること">
            {HERO_ITEMS.map(({ Icon, label }, i) => (
              <li key={label} className="flex items-center">
                {i > 0 && <span aria-hidden className="mx-1.5 mb-5 h-px w-3 bg-white/10" />}
                <span className="anim-stagger flex flex-col items-center gap-1.5" style={{ "--i": i + 2 } as React.CSSProperties}>
                  <span className="grid size-11 place-items-center rounded-xl border border-white/8 bg-white/4 text-accent/80">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-[9px] font-bold text-white/40">{label}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[22px] font-black tracking-tight text-white">飲み会をつくる</p>
          <p className="mt-1 text-[11px] font-semibold text-white/40">{home.lead}</p>
          <span className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[14px] font-black tracking-tight text-black">
            会をつくる
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </Link>

      {/* あなたの会。調整中と、これからの会だけを出す。終わった会は「これまでの会」へ */}
      {active.length > 0 && (
        <PartyGroup
          title="あなたの会"
          icon={<CalendarDays className="size-3.5" aria-hidden />}
          items={active.map((p) => {
            const st = statuses![p.id];
            const d = st.decision;
            return {
              party: p,
              icon: d ? <CircleCheck className="size-4" aria-hidden /> : <Hourglass className="size-4" aria-hidden />,
              sub: d ? `決定 ${dateLabel(d.date)} ${clock(d.start)}${d.shopName ? ` ・ ${d.shopName}` : ""}` : `調整中 ・ ${st.answered}人が回答`,
            };
          })}
        />
      )}

      <section>
        <SectionTitle icon={<Wrench className="size-3.5" aria-hidden />}>ツール</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <ToolTile href="/shops" icon={<Store className="size-6" aria-hidden />} title="お店を探す" sub={home.shops} />
          <ToolTile href="/split" icon={tierIcon} title="会計をする" sub={home.split} />
          {/* 4つとも同じ大きさで並べる。会社のときだけ、経費精算と役職の順の席次になる */}
          {home.extras.map((x) => (
            <ToolTile
              key={x.href}
              href={x.href}
              icon={x.icon === "collect" ? <ListChecks className="size-6" aria-hidden /> : <Shuffle className="size-6" aria-hidden />}
              title={x.label}
              sub={x.sub}
            />
          ))}
        </div>
      </section>

      {/* もとにした KANJI の「完了済みの会を見る」と同じ、横長の1行 */}
      {past > 0 && (
        <HomeRow href="/history" icon={<CircleCheck className="size-4" aria-hidden />} title="これまでの会を見る" sub={`${past}件 ・ お店・人数・金額`} />
      )}

      <p className="pt-2 text-center text-[10px] font-bold tracking-[0.2em] text-white/25">仙台限定</p>
      <p className="text-center text-[10px]">
        <Link href="/legal" className="text-white/30 underline underline-offset-2 hover:text-white/60">
          特定商取引法に基づく表記
        </Link>
      </p>
    </div>
  );
}
