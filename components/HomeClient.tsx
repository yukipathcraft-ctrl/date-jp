"use client";

import { ArrowRight, Briefcase, CalendarDays, ChevronRight, GraduationCap, MapPin, Moon, Repeat, Store, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AUDIENCES, loadAudience, saveAudience, type Audience } from "@/lib/audience";
import { loadMyParties, type MyParty } from "@/lib/myParties";
import { CrescentRule, LogoMark } from "./Logo";
import { SiteHeader } from "./SiteHeader";
import { SplashIntro } from "./SplashIntro";
import { BUTTON_PRIMARY } from "./ui";


type Phase = "loading" | "splash" | "choose" | "home";

/** 名前の由来。Date は、仙台の「伊達」と、英語の date(日にち)をかけている */
function NameStory() {
  return (
    <details className="group border-t border-border px-5 first:border-t-0">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3">
        <span aria-hidden className="grid size-5 shrink-0 place-items-center text-sm font-extrabold text-accent">
          伊
        </span>
        <span className="flex-1 font-bold text-muted">「Date」という名前について</span>
        <ChevronRight className="size-5 text-muted transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted">
        <p>
          <span className="font-bold text-text">伊達(だて)</span>と<span className="font-bold text-text">date(日にち)</span>
          をかけています。
        </p>
        <p className="mt-2">
          伊達政宗がつくった街・仙台で、飲み会の日にちを決めるアプリだから Date。ついでに英語の date には「会う約束」の意味もあります。
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
    const t = setTimeout(() => setPhase(next), 3000);
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

  // 答えがそろうと何が決まるかを、見本で先に見せる(学生と社会人で値を変える)
  const sample =
    audience === "student"
      ? { title: "ゼミの打ち上げ", when: "10/29(木) 18:30〜", budget: "3,000円まで", area: "五橋・片平", second: "二次会 4人" }
      : { title: "部署の歓迎会", when: "11/6(金) 19:00〜", budget: "5,000円まで", area: "国分町", second: "二次会 3人" };
  const rows = [
    { icon: CalendarDays, label: "日時", value: sample.when },
    { icon: Wallet, label: "予算", value: sample.budget, note: "誰がいくらと答えたかは出ない" },
    { icon: MapPin, label: "場所", value: sample.area },
    { icon: Moon, label: "いつまで", value: sample.second, note: "一次会で帰る人も先に分かる" },
  ];

  return (
    <>
      <SiteHeader />
      <div className="anim-rise mx-auto max-w-xl px-4 pt-7 pb-16">
        <CrescentRule />
        <p className="mt-3 text-sm font-bold text-muted">{AUDIENCES[audience].label}の飲み会を、仙台で</p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-extrabold tracking-tight">
          <span className="inline-block">URLを貼れば、</span>
          <span className="inline-block">あとは決まる</span>
        </h1>

        <section className="glow mt-6 overflow-hidden rounded-3xl border border-accent/30 bg-surface">
          <div className="flex items-center justify-between px-5 pt-5">
            <p className="text-xs font-bold text-muted">みんなが30秒で答えると</p>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-bold text-muted">見本</span>
          </div>
          <p className="px-5 pt-1 text-xl font-extrabold">{sample.title}</p>
          <dl className="mt-3 border-y border-border">
            {rows.map(({ icon: Icon, label, value, note }) => (
              <div key={label} className="flex items-center gap-3 border-t border-border px-5 py-3 first:border-t-0">
                <Icon className="size-5 shrink-0 text-accent" aria-hidden />
                <dt className="w-16 shrink-0 text-xs font-bold text-muted">{label}</dt>
                <dd className="min-w-0">
                  <span className="block font-extrabold">{value}</span>
                  {note && <span className="block text-[11px] text-muted">{note}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <div className="p-5">
            <Link href="/new" className={`${BUTTON_PRIMARY} w-full gap-2`}>
              会をつくる
              <ArrowRight className="size-5" aria-hidden />
            </Link>
            <p className="mt-2 text-center text-xs text-muted">登録なし。候補の日を選ぶだけ</p>
          </div>
        </section>

        <h2 className="mt-9 mb-3 text-sm font-bold text-muted">あなたの会</h2>
        <section className="overflow-hidden rounded-3xl border border-border bg-surface">
          {parties.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted">まだありません。つくった会は、この端末のここに並びます。</p>
          ) : (
            parties.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.id}/admin?token=${p.token}`}
                className="flex min-h-16 items-center gap-3 border-t border-border px-5 first:border-t-0"
              >
                <span aria-hidden className="h-8 w-1 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{p.title}</span>
                  <span className="block text-xs text-muted">
                    {new Date(p.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}につくった・幹事の画面へ
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </Link>
            ))
          )}
        </section>

        <h2 className="mt-9 mb-3 text-sm font-bold text-muted">店選びと、飲んだあと</h2>
        <section className="overflow-hidden rounded-3xl border border-border bg-surface">
          <Link href="/shops" className="flex min-h-20 items-center gap-4 px-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-accent">
              <Store className="size-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">お店だけ探す</span>
              <span className="block text-xs text-muted">押すたびに絞りこまれる。仙台のエリアと予算で</span>
            </span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </Link>
          <Link href="/split" className="flex min-h-20 items-center gap-4 border-t border-border px-5">
            {/* 傾斜の区分の色を4つ並べて、色分けの計算だと分かるようにする */}
            <span aria-hidden className="grid size-12 shrink-0 grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-2">
              {(["blue", "yellow", "green", "purple"] as const).map((t) => (
                <span key={t} className={`tier-${t} rounded-full bg-[var(--tb)]`} />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">傾斜会計</span>
              <span className="block text-xs text-muted">{audience === "student" ? "先輩は多め、飲まない人は少なめ" : "上司は多め、新人は少なめ"}</span>
            </span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </Link>
        </section>

        <section className="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
          <NameStory />
          <button
            type="button"
            onClick={() => setPhase("choose")}
            className="flex min-h-16 w-full items-center gap-3 border-t border-border px-5 text-left"
          >
            <Repeat className="size-5 shrink-0 text-muted" aria-hidden />
            <span className="flex-1 font-bold text-muted">いまは「{AUDIENCES[audience].label}」。切り替える</span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </button>
        </section>
      </div>
    </>
  );
}
