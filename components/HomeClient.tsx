"use client";

import { ArrowRight, Briefcase, CalendarDays, ChevronDown, ChevronRight, CircleCheck, Clock, GraduationCap, Hourglass, Info, ListChecks, MapPin, Shuffle, Store, Wallet, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { partyStatuses, type PartyStatus } from "@/app/actions";
import { AUDIENCES, loadAudience, saveAudience, type Audience } from "@/lib/audience";
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

const madeOn = (p: MyParty) => new Date(p.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });

/** 「調整中の会」「決まった会」の1かたまり。多いときは3件だけ出し、残りは押すと開く */
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
        {(all ? items : items.slice(0, 3)).map(({ party: p, icon: rowIcon, sub }) => (
          <HomeRow key={p.id} href={`/p/${p.id}/admin?token=${p.token}`} icon={rowIcon} title={p.title} sub={sub} />
        ))}
      </div>
      {!all && items.length > 3 && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mt-2 min-h-11 w-full text-xs font-bold text-white/40 underline underline-offset-2 hover:text-white/60"
        >
          ほかの{items.length - 3}件も見る
        </button>
      )}
    </section>
  );
}

/** 名前の由来。Date は、仙台の「伊達」と、英語の date(日にち)をかけている */
function NameStory() {
  return (
    <details className="group rounded-2xl bg-surface px-4 ring-1 ring-white/8">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3.5">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 text-sm font-black text-accent">
          伊
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-black tracking-tight text-white/85">「Date」という名前について</span>
          <span className="mt-0.5 block text-[10px] text-white/35">伊達(だて)と英語の date をかけています</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-white/30 transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="pb-4 pl-12 text-[13px] leading-relaxed text-white/50">
        <p>
          「Date(デート)」は、仙台の街を築いた<span className="font-bold text-white">伊達</span>政宗の「伊達(だて)」と、英語の
          <span className="font-bold text-white">date</span>をかけた名前です
        </p>
        <p className="mt-2">英語の date には、「日にち」と「人と会う約束」の2つの意味があります</p>
        <p className="mt-2">仙台でみんなが会う日にちを決めるアプリに、ぴったりの名前だと思って付けました</p>
      </div>
    </details>
  );
}

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

/** 起動画面 → 学生か社会人か → ホーム。起動画面はアプリを開いたときだけ出す(タップで飛ばせる) */
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
            <span className="block">選んだほうに合う予算・時間・お店を出します</span>
            <span className="block">あとからでも切り替えられます</span>
          </p>
          <div className="mt-8 grid gap-3">
            {(["student", "worker"] as const).map((a) => {
              const Icon = a === "student" ? GraduationCap : Briefcase;
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
  const pending = known.filter((p) => !statuses![p.id].decision);
  // 決まった会は、これからの会を日が近い順に出し、終わった会はそのあとに新しい順で出す
  const decided = known
    .filter((p) => statuses![p.id].decision)
    .sort((x, y) => {
      const a = statuses![x.id].decision!.date;
      const b = statuses![y.id].decision!.date;
      const af = a >= today;
      const bf = b >= today;
      return af !== bf ? (af ? -1 : 1) : af ? a.localeCompare(b) : b.localeCompare(a);
    });
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
      {/* いちばん上: 名前と、学生・社会人。隅に小さく置き、押すと選び直す画面を開く */}
      <div className="flex items-center justify-between pt-2">
        <Wordmark size={26} />
        <button
          type="button"
          onClick={() => setPhase("choose")}
          aria-label={`学生と社会人を選び直す(いまは${AUDIENCES[audience].label})`}
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
          <p className="mt-1 text-[11px] font-semibold text-white/40">URLを貼るだけで飲み会が決まります</p>
          <span className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[14px] font-black tracking-tight text-black">
            会をつくる
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </Link>

      {/* 決まった会と、まだ答えを集めている会を分けて出す */}
      {pending.length > 0 && (
        <PartyGroup
          title="調整中の会"
          icon={<Hourglass className="size-3.5" aria-hidden />}
          items={pending.map((p) => ({
            party: p,
            icon: <Hourglass className="size-4" aria-hidden />,
            sub: `${statuses![p.id].answered}人が回答 ・ ${madeOn(p)}につくった会`,
          }))}
        />
      )}
      {decided.length > 0 && (
        <PartyGroup
          title="決まった会"
          icon={<CircleCheck className="size-3.5" aria-hidden />}
          items={decided.map((p) => {
            const d = statuses![p.id].decision!;
            return {
              party: p,
              icon: <CircleCheck className="size-4" aria-hidden />,
              sub: `${dateLabel(d.date)} ${clock(d.start)}〜${d.shopName ? ` ・ ${d.shopName}` : ""}${d.date < today ? " ・ 終わった会" : ""}`,
            };
          })}
        />
      )}

      <section>
        <SectionTitle icon={<Wrench className="size-3.5" aria-hidden />}>ツール</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <ToolTile href="/shops" icon={<Store className="size-6" aria-hidden />} title="お店を探す" sub="場所と予算ですぐに出す" />
          <ToolTile
            href="/split"
            icon={tierIcon}
            title="会計をする"
            sub={audience === "student" ? "先輩多めの傾斜も割り勘も" : "上司多めの傾斜も割り勘も"}
          />
          <ToolTile href="/collect" icon={<ListChecks className="size-6" aria-hidden />} title="集金のチェック" sub="誰が払ったか一目で" />
          <ToolTile href="/seats" icon={<Shuffle className="size-6" aria-hidden />} title="席決め" sub="くじでテーブルを分ける" />
        </div>
      </section>

      <section>
        <SectionTitle icon={<Info className="size-3.5" aria-hidden />}>このアプリについて</SectionTitle>
        <NameStory />
        <p className="mt-6 text-center text-[10px] font-bold tracking-[0.2em] text-white/25">仙台生まれ ・ 全国のお店に対応</p>
      </section>
    </div>
  );
}
