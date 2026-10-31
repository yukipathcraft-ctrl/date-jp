"use client";

import { CalendarClock, CalendarDays, Calculator, Check, ChevronDown, ChevronRight, KeyRound, PartyPopper, Store, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { decide } from "@/app/actions";
import { dateLabel } from "@/lib/sendai";
import { decidedText, inviteText } from "@/lib/share";
import type { Shop } from "@/lib/shops";
import type { Decision } from "@/lib/store/types";
import type { DateRank } from "@/lib/summary";
import { saveAdminToken } from "./CreateForm";
import { Fold } from "./Fold";
import { MustPicker } from "./MustPicker";
import { SendButtons, useCanShare } from "./SendButtons";
import { SPLIT_NAMES_KEY } from "./SplitClient";
import { BUTTON_PRIMARY } from "./ui";

type Props = {
  partyId: string;
  title: string;
  token: string;
  created: boolean;
  ranking: DateRank[];
  bestDate: string | null;
  shops: Shop[];
  decision: Decision | null;
  /** その日に行く人の名前と、お酒を飲まないか。会計に持っていく */
  attendees: { name: string; soft: boolean }[];
  /** 幹事が決めた開始時刻(分)。招待の文に添える */
  start: number | null;
  /** 答えた人の名前と、そのうち幹事が「必ず来てほしい」にした人 */
  names: string[];
  must: string[];
};

/** 「幹事が決める」の中の小見出し。選ぶものごとに色(tier-*)を変え、アイコンを添える */
function StepHead({ tone, icon, children }: { tone: "blue" | "orange"; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className={`tier-${tone} mt-5 mb-2 flex items-center gap-2 text-sm font-black text-[var(--tc)]`}>
      <span className="grid size-7 place-items-center rounded-lg bg-[var(--ts)] text-[var(--tb)]">{icon}</span>
      {children}
    </p>
  );
}

/** 枠の見出し。アイコンの丸と、何をする枠かの一言 */
function BoxHead({ icon, title, note, tone }: { icon: React.ReactNode; title: string; note: string; tone: "plain" | "key" }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          tone === "key" ? "bg-accent text-accent-text" : "bg-line/15 text-line-strong"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className={`font-black ${tone === "key" ? "text-match-text" : "text-lg"}`}>{title}</h2>
        <p className={`mt-0.5 text-xs ${tone === "key" ? "text-match-text/85" : "text-muted"}`}>{note}</p>
      </div>
    </div>
  );
}

export function AdminPanel({ partyId, title, token, created, ranking, bestDate, shops, decision, attendees, start: partyStart, names, must }: Props) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const canShare = useCanShare();
  const [date, setDate] = useState<string | null>(decision?.date ?? bestDate);
  const [shopId, setShopId] = useState<string | null>(decision?.shopId ?? shops[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // 決めるときのお店の候補は、最初は3軒だけ出す(選んだお店が4軒目より後なら、それも出す)
  const [allShops, setAllShops] = useState(false);
  const shownShops = allShops ? shops : shops.filter((s, i) => i < 3 || s.id === shopId);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(location.origin);
    saveAdminToken(partyId, token);
  }, [partyId, token]);

  const guestUrl = `${origin}/p/${partyId}`;
  const adminUrl = `${origin}/p/${partyId}/admin?token=${token}`;
  const adminNote = `「${title}」の幹事用URL(自分用)`;
  const decidedMessage = decision ? decidedText(title, decision.date, decision.start, decision.shopName, guestUrl) : "";

  function submit(choice: { date: string; shopId: string | null } | null) {
    setError(null);
    start(async () => {
      const result = await decide(partyId, token, choice);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const invite = (
      <section className={`mx-4 rounded-3xl border panel px-4 py-6 ${decision ? "mt-4" : ""}`}>
        {created && <p className="anim-rise mb-3 text-sm font-bold text-ok">✓ できました!</p>}
        <BoxHead
          tone="plain"
          icon={<Users className="size-5" />}
          title="みんなに送る"
          note="グループやチャットに送るだけで、みんなが回答"
        />
        <SendButtons
          mainLabel="共有してみんなに送る"
          share={{ text: inviteText(title, guestUrl, partyStart) }}
          copy={guestUrl}
          canShare={canShare}
        />
        {/* 幹事用の URL は、いつも使うものではないのでたたむ */}
        {/* 作った直後だけは開いておき、幹事用の URL を自分に残してもらう */}
        <details open={created} className="group mt-4 rounded-2xl bg-surface-2 px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
            <span className="flex-1">幹事用のURL</span>
            <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
          </summary>
        {/* スマホで作ってパソコンでも開く、といった使い方があるので、自分に送る枠は目立たせておく */}
        <div className="mt-5 rounded-2xl border border-accent/40 bg-match-soft p-4">
          <BoxHead
            tone="key"
            icon={<KeyRound className="size-5" />}
            title="幹事用のURLを自分に残す"
            note="日にちとお店を決める自分用のページ"
          />
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-bg/40 px-3 py-2 text-xs text-match-text">
            <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              この端末ではトップの「あなたの会」にも保存済み
            </span>
          </p>
          <SendButtons
            mainLabel="共有して自分に残す"
            share={{ title: adminNote, text: adminNote, url: adminUrl }}
            copy={adminUrl}
            canShare={canShare}
          />
        </div>
        </details>
      </section>
  );

  // 決まったあとは「決まったよ」を先に出す
  return (
    <>
      {!decision && invite}

      {decision ? (
        <section className="anim-rise mx-4 rounded-3xl border panel px-4 py-6">
          <p className="flex items-center gap-2 text-lg font-black">
            <PartyPopper className="size-5" aria-hidden />
            決まったことを知らせる
          </p>
          <p className="mt-1 text-sm text-muted">日にち・時間・お店入りの案内文</p>
          <SendButtons
            mainLabel="共有して「決まったよ」を送る"
            share={{ text: decidedMessage }}
            copy={decidedMessage}
            copyLabel="送る文をコピー"
            canShare={canShare}
          />
          <div className="mt-5 border-t border-border pt-4" />
          <button
            type="button"
            onClick={() => {
              // 名前は URL に載せず、このタブの中だけで渡す
              try {
                sessionStorage.setItem(SPLIT_NAMES_KEY, JSON.stringify(attendees));
              } catch {}
              router.push(`/split?from=${partyId}`);
            }}
            // 会が決まったあとの次の一歩なので、ほかのボタンより目立つ金色の枠のカードにする
            className="flex w-full items-center gap-3 rounded-2xl border border-accent/60 bg-accent/10 px-4 py-3.5 text-left transition-colors hover:bg-accent/15 active:scale-[0.99]"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-text">
              <Calculator className="size-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black">この会の会計をする</span>
              <span className="mt-0.5 block text-xs text-muted">{attendees.length}人の名前を入れた状態からスタート</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-accent" aria-hidden />
          </button>
          {/* 取り消しはめったに使わないので、小さな文字のボタンにする */}
          <button
            type="button"
            onClick={() => window.confirm("決定を取り消して、日にちとお店を選び直しますか?") && submit(null)}
            disabled={pending}
            className="mx-auto mt-3 flex min-h-11 items-center px-3 text-xs font-bold text-muted underline underline-offset-2 hover:text-text"
          >
            決定を取り消す
          </button>
        </section>
      ) : (
        ranking.some((r) => r.ok > 0) && (
          <section className="mt-4 mx-4 rounded-3xl border panel px-4 py-6">
            <h2 className="text-lg font-black">幹事が決める</h2>
            <p className="mt-1 text-sm text-muted">みんなの答えから選んだ、いちばん良さそうな日とお店</p>
            <MustPicker partyId={partyId} token={token} names={names} must={must} />
            <StepHead tone="blue" icon={<CalendarDays className="size-4" aria-hidden />}>
              日にち
            </StepHead>
            <div className="tier-blue grid grid-cols-2 gap-1.5">
              {ranking
                .filter((r) => r.ok > 0)
                .map((r) => (
                  <button
                    key={r.date}
                    type="button"
                    aria-pressed={date === r.date}
                    onClick={() => setDate(r.date)}
                    className={`min-h-12 rounded-xl border px-2 text-sm font-bold transition-colors ${
                      date === r.date ? "border-[var(--tb)] bg-[var(--tb)] text-black" : "border-[var(--tb)]/30 bg-[var(--ts)] text-[var(--tc)]"
                    }`}
                  >
                    {date === r.date && "✓ "}
                    {dateLabel(r.date)} ・ ○{r.ok}人
                    {/* 必ず来てほしい人を選んだときだけ、その人たちが来られるかを添える(色だけでなく記号と文字で) */}
                    {must.length > 0 && (
                      <span
                        className={`mt-0.5 inline-block rounded-md px-1.5 text-[11px] ${
                          r.mustOk ? "tier-green bg-[var(--ts)] text-[var(--tc)]" : "tier-red bg-[var(--ts)] text-[var(--tc)]"
                        }`}
                      >
                        {r.mustOk ? "★ 必ず来てほしい人OK" : "× 来られない人あり"}
                      </span>
                    )}
                  </button>
                ))}
            </div>
            {shops.length > 0 && (
              <>
                <StepHead tone="orange" icon={<Store className="size-4" aria-hidden />}>
                  お店
                </StepHead>
                {/* 選んでいないお店は色を付けず、選んだお店だけを暖かいオレンジにする */}
                <div className="tier-orange space-y-1.5">
                  {/* 「お店はあとで決める」はいちばん前に、お店とは違う点線の枠で出す(日にちだけ先に決めたい幹事が多いため) */}
                  <button
                    type="button"
                    aria-pressed={shopId === null}
                    onClick={() => setShopId(null)}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 text-left transition-colors ${
                      shopId === null ? "border-[var(--tb)] bg-[var(--ts)] text-[var(--tc)]" : "border-white/20 text-white/80 hover:border-white/40"
                    }`}
                  >
                    <CalendarClock className="size-5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">
                        {shopId === null && "✓ "}お店はあとで決める
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-muted">日にちだけ先に決定、お店はあとから</span>
                    </span>
                  </button>
                  {/* 写真と目安をここで見せて、下のお店の一覧まで行かなくても、その場で選んで決められるようにする */}
                  {shownShops.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={shopId === s.id}
                      onClick={() => setShopId(s.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2 pr-3 text-left transition-colors ${
                        shopId === s.id ? "border-[var(--tb)] bg-[var(--ts)]" : "border-border bg-surface hover:border-white/30"
                      }`}
                    >
                      {s.photo ? (
                        // 外のお店の写真。最適化は使わない
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photo} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-surface-2">
                          <Store className="size-6 text-muted" aria-hidden />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-black ${shopId === s.id ? "text-[var(--tc)]" : ""}`}>{s.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {[s.genre, s.budgetLabel].filter(Boolean).join(" ・ ")}
                        </span>
                        {s.access && <span className="block truncate text-xs text-muted">{s.access}</span>}
                      </span>
                      <span
                        aria-hidden
                        className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                          shopId === s.id ? "border-[var(--tb)] bg-[var(--tb)] text-black" : "border-white/25"
                        }`}
                      >
                        {shopId === s.id && <Check className="size-4" strokeWidth={3} />}
                      </span>
                    </button>
                  ))}
                  {!allShops && shops.length > shownShops.length && (
                    <button
                      type="button"
                      onClick={() => setAllShops(true)}
                      className="min-h-11 w-full text-xs font-bold text-muted underline underline-offset-2 hover:text-text"
                    >
                      ほかのお店も見る(あと{shops.length - shownShops.length}軒)
                    </button>
                  )}
                </div>
              </>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm font-bold text-danger">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={pending || date === null}
              onClick={() => date && submit({ date, shopId })}
              className={`${BUTTON_PRIMARY} mt-5 w-full`}
            >
              {pending ? "決めています…" : "これで決定する"}
            </button>
          </section>
        )
      )}
      {/* 決まったあとは、招待と幹事用の URL はたたんでおく(途中から入る人に送るときに開く) */}
      {decision && (
        <Fold title="招待の URL・幹事用の URL" note="あとから入る人に送るときに">
          {invite}
        </Fold>
      )}
    </>
  );
}
