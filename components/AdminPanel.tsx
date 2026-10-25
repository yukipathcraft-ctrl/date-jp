"use client";

import { Calculator, Check, Copy, KeyRound, PartyPopper, Send, Share, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { decide } from "@/app/actions";
import { dateLabel } from "@/lib/sendai";
import { decidedText, inviteText, lineShareUrl } from "@/lib/share";
import type { Shop } from "@/lib/shops";
import type { Decision } from "@/lib/store/types";
import type { DateRank } from "@/lib/summary";
import { saveAdminToken } from "./CreateForm";
import { SPLIT_NAMES_KEY } from "./SplitClient";
import { BUTTON_LINE, BUTTON_PRIMARY, BUTTON_SUB } from "./ui";

type Props = {
  partyId: string;
  title: string;
  token: string;
  created: boolean;
  ranking: DateRank[];
  bestDate: string | null;
  shops: Shop[];
  decision: Decision | null;
  /** その日に行く人の名前。傾斜会計に持っていく */
  attendees: string[];
};

/** LINE の下に半分の幅で2つ並べる、控えめなボタン */
const BUTTON_HALF = `${BUTTON_SUB} min-w-0 gap-1.5 whitespace-nowrap px-2 text-sm`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={BUTTON_HALF}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {}
      }}
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {done ? "コピーしました" : label}
    </button>
  );
}

/** スマホやパソコンの共有の画面を開く。Slack・メール・メモなど、入っているアプリから送り先を選べる */
function ShareButton({ data }: { data: ShareData }) {
  return (
    <button type="button" className={BUTTON_HALF} onClick={() => navigator.share(data).catch(() => {})}>
      <Share className="size-4 shrink-0" aria-hidden />
      ほかのアプリ
    </button>
  );
}

/**
 * 送り方の3つのボタン。いちばん使う LINE を大きく置き、その下に「ほかのアプリ」と「コピー」を半分の幅で並べる。
 * 共有の画面がない環境では、コピーを横いっぱいにする
 */
function SendButtons({ line, lineLabel, share, copy, canShare }: {
  line: string;
  lineLabel: string;
  share: ShareData;
  copy: string;
  canShare: boolean;
}) {
  return (
    <div className="mt-4 space-y-2">
      <a href={lineShareUrl(line)} className={`${BUTTON_LINE} w-full gap-2`}>
        <Send className="size-4" aria-hidden />
        {lineLabel}
      </a>
      <div className={`grid gap-2 ${canShare ? "grid-cols-2" : "grid-cols-1"}`}>
        {canShare && <ShareButton data={share} />}
        <CopyButton text={copy} label="コピー" />
      </div>
    </div>
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
        <h2 className={`font-extrabold ${tone === "key" ? "text-match-text" : "text-lg"}`}>{title}</h2>
        <p className={`mt-0.5 text-xs ${tone === "key" ? "text-match-text/85" : "text-muted"}`}>{note}</p>
      </div>
    </div>
  );
}

export function AdminPanel({ partyId, title, token, created, ranking, bestDate, shops, decision, attendees }: Props) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  // スマホの共有の画面(Slack・メモ・メールなど)を開けるか。開けないパソコンではコピーだけにする
  const [canShare, setCanShare] = useState(false);
  const [date, setDate] = useState<string | null>(decision?.date ?? bestDate);
  const [shopId, setShopId] = useState<string | null>(decision?.shopId ?? shops[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(location.origin);
    setCanShare(typeof navigator.share === "function");
    saveAdminToken(partyId, token);
  }, [partyId, token]);

  const guestUrl = `${origin}/p/${partyId}`;
  const adminUrl = `${origin}/p/${partyId}/admin?token=${token}`;
  const adminNote = `「${title}」の幹事用URL(人に送らない)`;

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
          lineLabel="LINEでみんなに送る"
          share={{ text: inviteText(title, guestUrl) }}
          copy={guestUrl}
          canShare={canShare}
        />

        <div className="mt-5 rounded-2xl border border-accent/40 bg-match-soft p-4">
          <BoxHead
            tone="key"
            icon={<KeyRound className="size-5" />}
            title="幹事用のURLを自分に残す"
            note="日にちとお店はこのページで決めます。なくすと戻せないので、人には送らず自分だけに残してください"
          />
          <SendButtons
            line={`${adminNote}\n${adminUrl}`}
            lineLabel="自分のLINEに送って保存"
            share={{ title: adminNote, text: adminNote, url: adminUrl }}
            copy={adminUrl}
            canShare={canShare}
          />
        </div>
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
          <a
            href={lineShareUrl(decidedText(title, decision.date, decision.start, decision.shopName, guestUrl))}
            className={`${BUTTON_LINE} mt-4 w-full gap-2`}
          >
            <Send className="size-4" aria-hidden />
            LINEで「決まったよ」を送る
          </a>
          <button
            type="button"
            onClick={() => {
              // 名前は URL に載せず、このタブの中だけで渡す
              try {
                sessionStorage.setItem(SPLIT_NAMES_KEY, JSON.stringify(attendees));
              } catch {}
              router.push("/split");
            }}
            className={`${BUTTON_SUB} mt-2 w-full gap-2`}
          >
            <Calculator className="size-4" aria-hidden />
            この会の傾斜会計({attendees.length}人)
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
