"use client";

import { Briefcase, CalendarDays, ChevronRight, GraduationCap, Repeat, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AUDIENCES, loadAudience, saveAudience, type Audience } from "@/lib/audience";
import { loadMyParties, type MyParty } from "@/lib/myParties";
import { WEIGHTS } from "@/lib/split";
import { CreateForm } from "./CreateForm";
import { LogoMark } from "./Logo";
import { SiteHeader } from "./SiteHeader";
import { SplashIntro } from "./SplashIntro";


type Phase = "loading" | "splash" | "choose" | "home";

/** ホームの行。どの枠も「アイコンの四角 → 見出しと説明 → 矢印」の同じ形にそろえる */
function HomeRow({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-20 items-center gap-4 border-t border-border px-5 py-3 transition-colors first:border-t-0 hover:bg-surface-2/60"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-accent">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{sub}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}

function SectionTitle({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return <h2 className={`${first ? "mt-6" : "mt-9"} mb-3 px-1 text-sm font-bold text-muted`}>{children}</h2>;
}

/** 名前の由来。Date は、仙台の「伊達」と、英語の date(日にち)をかけている */
function NameStory() {
  return (
    <details className="group border-t border-border px-5 first:border-t-0">
      <summary className="flex min-h-20 cursor-pointer list-none items-center gap-4 py-3">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-lg font-extrabold text-accent">
          伊
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold">「Date」という名前について</span>
          <span className="mt-0.5 block text-xs text-muted">伊達と date をかけています</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="pb-5 pl-16 text-sm leading-relaxed text-muted">
        <p>
          仙台の街をつくった<span className="font-bold text-text">伊達</span>政宗の「伊達」と、英語で日にちを表す
          <span className="font-bold text-text">date</span>をかけた名前です
        </p>
        <p className="mt-2">
          date には人と会う約束という意味もあるので、仙台で飲み会の日にちを決めるアプリにちょうどいいと思って付けました
        </p>
      </div>
    </details>
  );
}

/** 起動画面 → 学生か社会人か → ホーム。起動画面は毎回出す(タップで飛ばせる) */
export function HomeClient() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [audience, setAudience] = useState<Audience | null>(null);
  const [parties, setParties] = useState<MyParty[]>([]);

  useEffect(() => {
    // localStorage はブラウザでしか読めないので、描画のあとで読む
    const saved = loadAudience();
    /* eslint-disable react-hooks/set-state-in-effect */
    setAudience(saved);
    setParties(loadMyParties());
    // 起動の演出は、トップを開くたびに毎回出す
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next: Phase = saved ? "home" : "choose";
    if (reduce) {
      setPhase(next);
      return;
    }
    setPhase("splash");
    /* eslint-enable react-hooks/set-state-in-effect */
    const t = setTimeout(() => setPhase(next), 3200);
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
          setPhase(audience ? "home" : "choose");
        }}
      />
    );
  }

  if (phase === "choose" || audience === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-10">
        <div className="anim-rise">
          <LogoMark size={56} />
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">あなたは?</h1>
          <p className="mt-2 text-muted">選んだほうに合わせて予算や時間やお店が変わり、あとからでも切り替えられます</p>
          <div className="mt-8 grid gap-3">
            {(["student", "worker"] as const).map((a) => {
              const Icon = a === "student" ? GraduationCap : Briefcase;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => choose(a)}
                  className="flex min-h-24 items-center gap-4 rounded-3xl border border-border bg-surface px-5 text-left transition-colors hover:border-accent"
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-accent/60 text-accent">
                    <Icon className="size-7" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-extrabold">{AUDIENCES[a].label}</span>
                    <span className="block text-sm text-muted">{AUDIENCES[a].note}</span>
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

  return (
    <>
      <SiteHeader />
      <div className="anim-rise mx-auto max-w-xl px-4 pt-5 pb-16">
        <p className="text-sm font-bold text-muted">仙台で{AUDIENCES[audience].label}の飲み会をするなら</p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-extrabold tracking-tight">
          <span className="inline-block">URLを貼るだけで</span>
          <span className="inline-block">飲み会が決まります</span>
        </h1>

        {/* 見本は置かず、ここでそのまま会を作れるようにする */}
        <SectionTitle first>会をつくる</SectionTitle>
        <div className="glow rounded-3xl">
          <CreateForm />
        </div>

        {parties.length > 0 && (
          <>
            <SectionTitle>あなたの会</SectionTitle>
            <section className="overflow-hidden rounded-3xl border border-border bg-surface">
              {parties.map((p) => (
                <HomeRow
                  key={p.id}
                  href={`/p/${p.id}/admin?token=${p.token}`}
                  icon={<CalendarDays className="size-6" aria-hidden />}
                  title={p.title}
                  sub={`${new Date(p.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}につくった会`}
                />
              ))}
            </section>
          </>
        )}

        <SectionTitle>飲んだあと</SectionTitle>
        <section className="overflow-hidden rounded-3xl border border-border bg-surface">
          <HomeRow
            href="/split"
            icon={
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
            }
            title="傾斜会計"
            sub={audience === "student" ? "先輩には多めに、飲まない人には少なめに割れます" : "上司には多めに、新人には少なめに割れます"}
          />
        </section>

        <SectionTitle>お店だけ探したいとき</SectionTitle>
        <section className="overflow-hidden rounded-3xl border border-border bg-surface">
          <HomeRow
            href="/shops"
            icon={<Store className="size-6" aria-hidden />}
            title="お店だけ探す"
            sub="場所と予算を選ぶと、合うお店がすぐに出てきます"
          />
        </section>

        <SectionTitle>このアプリについて</SectionTitle>
        <section className="overflow-hidden rounded-3xl border border-border bg-surface">
          <NameStory />
          <button
            type="button"
            onClick={() => setPhase("choose")}
            className="flex min-h-20 w-full items-center gap-4 border-t border-border px-5 py-3 text-left transition-colors hover:bg-surface-2/60"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-accent">
              <Repeat className="size-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">学生と社会人を切り替える</span>
              <span className="mt-0.5 block text-xs text-muted">いまは{AUDIENCES[audience].label}向けの予算と時間で聞いています</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
          </button>
        </section>
      </div>
    </>
  );
}
