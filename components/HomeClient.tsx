"use client";

import { ArrowRight, CalendarDays, ChevronRight, GraduationCap, Briefcase, Moon, Repeat, Store, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AUDIENCES, loadAudience, saveAudience, type Audience } from "@/lib/audience";
import { loadMyParties, type MyParty } from "@/lib/myParties";
import { LogoMark } from "./Logo";
import { SiteHeader } from "./SiteHeader";
import { SplashIntro } from "./SplashIntro";
import { BUTTON_PRIMARY } from "./ui";


type Phase = "loading" | "splash" | "choose" | "home";

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
    const t = setTimeout(() => setPhase(next), 3400);
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
          <p className="mt-2 text-muted">予算や時間、出てくるお店が変わります。あとで変えられます。</p>
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

  const steps = [
    { icon: CalendarDays, label: "日程" },
    { icon: Store, label: "お店" },
    { icon: Moon, label: "いつまで" },
  ];

  return (
    <>
      <SiteHeader />
      <div className="anim-rise mx-auto max-w-xl px-4 pt-8 pb-16">
        <p className="text-sm font-bold text-muted">
          {AUDIENCES[audience].label}の飲み会を、仙台で
        </p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-extrabold tracking-tight">
          <span className="inline-block">幹事は、URLを</span>
          <span className="inline-block">貼るだけ</span>
        </h1>

        <section className="glow mt-6 rounded-3xl border border-accent/30 bg-surface px-5 pt-6 pb-5">
          <ol className="flex items-start justify-center">
            {steps.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex items-start">
                {i > 0 && <span aria-hidden className="mt-7 h-px w-8 bg-accent/40" />}
                <span className="flex w-16 flex-col items-center gap-2">
                  <span className="grid size-14 place-items-center rounded-2xl border border-border bg-surface-2 text-accent">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="text-xs font-bold text-muted">{label}</span>
                </span>
              </li>
            ))}
          </ol>
          <h2 className="mt-6 text-2xl font-extrabold">飲み会を作る</h2>
          <p className="mt-1 text-sm font-bold text-muted">みんなが30秒で答えると、日にち・予算・お店まで決まる</p>
          <Link href="/new" className={`${BUTTON_PRIMARY} mt-5 w-full gap-2`}>
            会をつくる
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </section>

        <p className="mt-8 mb-3 flex items-center gap-2 text-sm font-bold text-muted">ツール</p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/shops"
            className="flex flex-col items-center rounded-3xl border border-border bg-surface px-3 py-6 text-center transition-colors hover:border-accent/60"
          >
            <span className="grid size-14 place-items-center rounded-2xl border border-accent/60 text-accent">
              <Store className="size-7" aria-hidden />
            </span>
            <span className="mt-3 font-extrabold">お店を探す</span>
            <span className="mt-1 text-xs text-muted">エリア・予算・個室で</span>
          </Link>
          <Link
            href="#mine"
            className="flex flex-col items-center rounded-3xl border border-border bg-surface px-3 py-6 text-center transition-colors hover:border-accent/60"
          >
            <span className="grid size-14 place-items-center rounded-2xl border border-accent/60 text-accent">
              <Users className="size-7" aria-hidden />
            </span>
            <span className="mt-3 font-extrabold">作った会</span>
            <span className="mt-1 text-xs text-muted">{parties.length > 0 ? `${parties.length}件` : "まだありません"}</span>
          </Link>
        </div>

        <section id="mine" className="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
          {parties.map((p) => (
            <Link
              key={p.id}
              href={`/p/${p.id}/admin?token=${p.token}`}
              className="flex min-h-16 items-center gap-3 border-b border-border px-5 last:border-b-0"
            >
              <CalendarDays className="size-5 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-bold">{p.title}</span>
              <ChevronRight className="size-5 text-muted" aria-hidden />
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setPhase("choose")}
            className={`flex min-h-16 w-full items-center gap-3 px-5 text-left ${parties.length > 0 ? "border-t border-border" : ""}`}
          >
            <Repeat className="size-5 shrink-0 text-muted" aria-hidden />
            <span className="flex-1 font-bold text-muted">
              いまは「{AUDIENCES[audience].label}」。切り替える
            </span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </button>
        </section>
      </div>
    </>
  );
}
