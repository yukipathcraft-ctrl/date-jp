"use client";

import { CalendarClock, Calculator, Check, KeyRound, PartyPopper, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { decide } from "@/app/actions";
import type { Audience } from "@/lib/audience";
import { dateLabel } from "@/lib/sendai";
import { decidedText, inviteText } from "@/lib/share";
import type { Shop } from "@/lib/shops";
import type { Decision } from "@/lib/store/types";
import type { DateRank } from "@/lib/summary";
import { saveAdminToken } from "./CreateForm";
import { SendButtons, useCanShare } from "./SendButtons";
import { SPLIT_NAMES_KEY } from "./SplitClient";
import { BUTTON_PRIMARY, BUTTON_SUB } from "./ui";

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
  /** 社会人の会は、送るボタンを Slack・Teams 向けにする */
  audience: Audience;
  /** 幹事が決めた開始時刻(分)。招待の文に添える */
  start: number | null;
};

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

export function AdminPanel({ partyId, title, token, created, ranking, bestDate, shops, decision, attendees, audience, start: partyStart }: Props) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const canShare = useCanShare();
  const [date, setDate] = useState<string | null>(decision?.date ?? bestDate);
  const [shopId, setShopId] = useState<string | null>(decision?.shopId ?? shops[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

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
          note={audience === "worker" ? "Slack や Teams のチャンネルに貼れば、みんながそこから答えられます" : "グループに送れば、みんながそこから答えられます"}
        />
        <SendButtons
          line={inviteText(title, guestUrl, partyStart)}
          mainLabel="共有してみんなに送る"
          share={{ text: inviteText(title, guestUrl, partyStart) }}
          copy={guestUrl}
          canShare={canShare}
          audience={audience}
        />

        {/* スマホで作ってパソコンでも開く、といった使い方があるので、自分に送る枠は目立たせておく */}
        <div className="mt-5 rounded-2xl border border-accent/40 bg-match-soft p-4">
          <BoxHead
            tone="key"
            icon={<KeyRound className="size-5" />}
            title="幹事用のURLを自分に残す"
            note="日にちとお店はこのページで決めます。人には送らず、自分だけに残してください"
          />
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-bg/40 px-3 py-2 text-xs text-match-text">
            <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              この端末では、トップの「あなたの会」にも保存されています。別のスマホやパソコンでも開きたいときは、下から自分に送ってください
            </span>
          </p>
          <SendButtons
            line={`${adminNote}\n${adminUrl}`}
            mainLabel="共有して自分に残す"
            share={{ title: adminNote, text: adminNote, url: adminUrl }}
            copy={adminUrl}
            canShare={canShare}
            audience={audience}
          />
        </div>
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
          <p className="mt-1 text-sm text-muted">日にちと時間、お店を入れた文をみんなに送れます</p>
          <SendButtons
            mainLabel="共有して「決まったよ」を送る"
            line={decidedMessage}
            share={{ text: decidedMessage }}
            copy={decidedMessage}
            copyLabel="送る文をコピー"
            canShare={canShare}
            audience={audience}
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
            className={`${BUTTON_SUB} w-full gap-2`}
          >
            <Calculator className="size-4" aria-hidden />
            この会の会計({attendees.length}人)
          </button>
          <button type="button" onClick={() => submit(null)} disabled={pending} className={`${BUTTON_SUB} mt-2 w-full`}>
            決定を取り消す
          </button>
        </section>
      ) : (
        ranking.some((r) => r.ok > 0) && (
          <section className="mt-4 mx-4 rounded-3xl border panel px-4 py-6">
            <h2 className="text-lg font-black">幹事が決める</h2>
            <p className="mt-1 text-sm text-muted">みんなの答えからいちばん良さそうな日とお店を先に選んでおきました</p>
            <p className="mt-4 mb-2 text-sm font-bold">日にち</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ranking
                .filter((r) => r.ok > 0)
                .map((r) => (
                  <button
                    key={r.date}
                    type="button"
                    aria-pressed={date === r.date}
                    onClick={() => setDate(r.date)}
                    className={`min-h-12 rounded-xl border px-2 text-sm font-bold ${
                      date === r.date ? "border-accent bg-accent text-accent-text" : "border-border bg-surface"
                    }`}
                  >
                    {date === r.date && "✓ "}
                    {dateLabel(r.date)} ・ ○{r.ok}人
                  </button>
                ))}
            </div>
            {shops.length > 0 && (
              <>
                <p className="mt-4 mb-2 text-sm font-bold">お店</p>
                <div className="space-y-1.5">
                  {/* 「お店はあとで決める」はいちばん前に、お店とは違う点線の枠で出す(日にちだけ先に決めたい幹事が多いため) */}
                  <button
                    type="button"
                    aria-pressed={shopId === null}
                    onClick={() => setShopId(null)}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 text-left transition-colors ${
                      shopId === null ? "border-accent bg-accent/10 text-accent" : "border-white/20 text-white/80 hover:border-white/40"
                    }`}
                  >
                    <CalendarClock className="size-5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">
                        {shopId === null && "✓ "}お店はあとで決める
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-muted">日にちだけ先に決めて、お店はあとで選びます</span>
                    </span>
                  </button>
                  {shops.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={shopId === s.id}
                      onClick={() => setShopId(s.id)}
                      className={`flex min-h-12 w-full items-center rounded-xl border px-4 text-left text-sm font-bold ${
                        shopId === s.id ? "border-accent bg-accent text-accent-text" : "border-border bg-surface"
                      }`}
                    >
                      {shopId === s.id && "✓ "}
                      {s.name}
                    </button>
                  ))}
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
      {decision && invite}
    </>
  );
}
