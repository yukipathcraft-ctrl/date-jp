"use client";

import { Calculator, KeyRound, PartyPopper, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { addTransitionType, startTransition, useEffect, useState, useTransition } from "react";
import { decide } from "@/app/actions";
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
        <h2 className={`font-extrabold ${tone === "key" ? "text-match-text" : "text-lg"}`}>{title}</h2>
        <p className={`mt-0.5 text-xs ${tone === "key" ? "text-match-text/85" : "text-muted"}`}>{note}</p>
      </div>
    </div>
  );
}

export function AdminPanel({ partyId, title, token, created, ranking, bestDate, shops, decision, attendees }: Props) {
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
  const adminNote = `「${title}」の幹事用URL(人に送らない)`;
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
      <section className={`mx-4 rounded-3xl border border-border bg-surface px-4 py-6 ${decision ? "mt-4" : ""}`}>
        {created && <p className="anim-rise mb-3 text-sm font-bold text-ok">✓ できました!</p>}
        <BoxHead
          tone="plain"
          icon={<Users className="size-5" />}
          title="みんなに送る"
          note="グループに送れば、みんながそこから答えられます"
        />
        <SendButtons
          line={inviteText(title, guestUrl)}
          mainLabel="共有してみんなに送る"
          share={{ text: inviteText(title, guestUrl) }}
          copy={guestUrl}
          canShare={canShare}
        />

        {/* 作った会はこの端末の「あなたの会」に自動で残るので、送るのは別の端末でも開きたいときだけ。たたんでおく */}
        <details className="mt-5 rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm">
            <KeyRound className="size-4 shrink-0 text-accent" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">この会はトップの「あなたの会」に保存されています</span>
              <span className="block text-xs text-muted">別のスマホやパソコンでも開きたいときは、ここから送れます</span>
            </span>
          </summary>
          <p className="mt-2 text-xs text-muted">
            保存されるのはこの端末だけです。幹事用のURLは日にちとお店を決めるためのものなので、人には送らないでください
          </p>
          <SendButtons
            line={`${adminNote}\n${adminUrl}`}
            mainLabel="共有して自分に送る"
            share={{ title: adminNote, text: adminNote, url: adminUrl }}
            copy={adminUrl}
            canShare={canShare}
          />
        </details>
      </section>
  );

  // 決まったあとは「決まったよ」を先に出す
  return (
    <>
      {!decision && invite}

      {decision ? (
        <section className="anim-rise mx-4 rounded-3xl border border-border bg-surface px-4 py-6">
          <p className="flex items-center gap-2 text-lg font-extrabold">
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
          />
          <div className="mt-5 border-t border-border pt-4" />
          <button
            type="button"
            onClick={() => {
              // 名前は URL に載せず、このタブの中だけで渡す
              try {
                sessionStorage.setItem(SPLIT_NAMES_KEY, JSON.stringify(attendees));
              } catch {}
              startTransition(() => {
                addTransitionType("nav-forward");
                router.push("/split");
              });
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
          <section className="mt-4 mx-4 rounded-3xl border border-border bg-surface px-4 py-6">
            <h2 className="text-lg font-extrabold">幹事が決める</h2>
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
                  {[...shops.map((s) => ({ id: s.id as string | null, name: s.name })), { id: null, name: "お店はあとで決める" }].map((s) => (
                    <button
                      key={s.id ?? "none"}
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
