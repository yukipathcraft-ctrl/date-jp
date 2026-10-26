"use client";

import { Check, Crown, RotateCcw, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setCollectionPayment } from "@/app/actions";
import { yen } from "@/lib/sendai";
import { loadMyCollections, rememberCollection } from "@/lib/myCollections";
import { MADE_WITH, reminderText } from "@/lib/share";
import type { Collection } from "@/lib/store/types";
import { SendButtons, useCanShare } from "./SendButtons";

// 集金のページ。払ったかどうかを、本人が押すか幹事が記録する。色だけでなく ✓ と文字でも分かるようにする

/** 幹事の鍵。集金のページを作った端末に残し、鍵なしの URL で開いても幹事として使えるようにする */
const hostKey = (id: string) => `nomi:collect:${id}`;

/** 全員そろったときに、金色の粒を8方向へはじけさせる(飾りなので読み上げない) */
function Burst() {
  const dirs = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <span aria-hidden className="burst pointer-events-none absolute top-1/2 left-2">
      {dirs.map((deg) => (
        <span
          key={deg}
          className="absolute size-1.5 rounded-full bg-accent"
          style={
            {
              "--dx": `${Math.round(Math.cos((deg * Math.PI) / 180) * 34)}px`,
              "--dy": `${Math.round(Math.sin((deg * Math.PI) / 180) * 34)}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

export function CollectionView({
  collection: c,
  hostToken,
}: {
  collection: Omit<Collection, "adminHash">;
  hostToken: string | null;
}) {
  const router = useRouter();
  const canShare = useCanShare();
  const [token, setToken] = useState<string | null>(hostToken);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setOrigin(location.origin);
    try {
      if (hostToken) {
        localStorage.setItem(hostKey(c.id), hostToken);
        // 「集金のチェック」の一覧に出す(作った日は最初に開いた日のまま)
        const prev = loadMyCollections().find((x) => x.id === c.id);
        rememberCollection({ id: c.id, token: hostToken, title: c.title, total: c.total, createdAt: prev?.createdAt ?? Date.now() });
      } else setToken(localStorage.getItem(hostKey(c.id)));
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [c.id, c.title, c.total, hostToken]);

  // ほかの人が押した「払った」を、画面に戻ってきたときに読み直す
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [router]);

  const isHost = token !== null;
  const payers = c.people.filter((p) => !p.organizer);
  const unpaid = payers.filter((p) => !c.payments[p.id]);
  const unpaidYen = unpaid.reduce((sum, p) => sum + p.amount, 0);
  const host = c.people.find((p) => p.organizer);
  const url = `${origin}/c/${c.id}`;
  const heading = c.title ? `「${c.title}」の集金` : "お会計の集金";

  function setPaid(personId: number, name: string, paid: boolean) {
    if (!isHost && paid && !window.confirm(`${name}さんとして「払った」にしますか?`)) return;
    setError(null);
    start(async () => {
      const r = await setCollectionPayment(c.id, personId, paid, token);
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  }

  const askText = [
    `${c.title ? `「${c.title}」の` : ""}お会計です`,
    "金額を確かめて、払ったら自分の名前の「払った」を押してください",
    url,
    "",
    MADE_WITH,
  ].join("\n");
  const remind = `${reminderText(c.audience, c.title, unpaid.map((p) => ({ name: p.name, amount: p.amount })))}\n${url}`;

  return (
    <>
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm font-bold text-muted">{isHost ? "幹事の集金ページ" : "集金"}</p>
        <h1 className="mt-1 text-[22px] font-black tracking-tight">{heading}</h1>
        <p className="mt-1 text-sm text-muted">
          合計 {yen(c.total)}・{c.people.length}人{host ? `・幹事は${host.name}さん` : ""}
        </p>
      </div>

      <section className="mx-4 rounded-3xl border panel px-5 py-5" aria-live="polite">
        <p className="flex items-center gap-2 font-black">
          <Wallet className="size-5" aria-hidden />
          {payers.length}人中{payers.length - unpaid.length}人が払いました
        </p>
        <div className="tier-green mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div
            className="anim-grow h-full rounded-full bg-[var(--tb)]"
            style={{ width: `${payers.length ? ((payers.length - unpaid.length) / payers.length) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-2 text-sm">
          {unpaid.length === 0 ? (
            <span className="tier-green anim-pop relative inline-flex items-center gap-1 font-bold text-[var(--tc)]">
              <Burst />
              <Check className="size-4" aria-hidden />
              全員の支払いがそろいました
            </span>
          ) : (
            <span className="text-muted">まだ{unpaid.length}人・あと{yen(unpaidYen)}</span>
          )}
        </p>
        {!isHost && unpaid.length > 0 && (
          <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
            払ったら、下の自分の名前の「払った」を押してください。幹事に伝わるので、わざわざ連絡しなくて大丈夫です
          </p>
        )}
      </section>

      <ul className="mx-4 mt-3 divide-y divide-border overflow-hidden rounded-3xl border panel">
        {c.people.map((p, i) => {
          const pay = c.payments[p.id];
          return (
            <li key={p.id} className="anim-stagger flex min-h-16 items-center gap-2.5 px-4" style={{ "--i": i } as React.CSSProperties}>
              <span
                aria-hidden
                className={`tier-${p.tone} grid size-9 shrink-0 place-items-center rounded-full bg-[var(--ts)] text-sm font-black text-[var(--tc)]`}
              >
                {[...p.name][0] ?? "?"}
              </span>
              <span className="min-w-0 flex-1 py-2">
                <span className="block truncate font-bold">{p.name}</span>
                <span className="mt-1 flex items-center gap-1">
                  {p.label && !p.organizer && (
                    <span className={`tier-${p.tone} inline-flex items-center gap-0.5 whitespace-nowrap rounded-md bg-[var(--ts)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--tc)]`}>
                      <span aria-hidden>{p.mark}</span>
                      {p.label}
                    </span>
                  )}
                  {p.organizer && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-accent-text">
                      <Crown className="size-3" aria-hidden />
                      幹事
                    </span>
                  )}
                </span>
              </span>
              <span className={`shrink-0 text-lg font-black tabular-nums ${pay ? "text-muted line-through decoration-2" : ""}`}>
                {yen(p.amount)}
              </span>
              <span className="flex w-[5.5rem] shrink-0 flex-col items-center gap-0.5">
                {p.organizer ? (
                  <span className="text-[11px] font-bold text-muted">立て替え</span>
                ) : pay ? (
                  <>
                    <span className="tier-green anim-pop inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-full bg-[var(--tb)] text-xs font-bold text-black">
                      <Check className="size-3.5" aria-hidden />
                      {pay.by === "host" ? "受取済み" : "払った"}
                    </span>
                    {(isHost || pay.by === "self") && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setPaid(p.id, p.name, false)}
                        className="inline-flex min-h-8 items-center gap-0.5 text-[11px] font-bold text-muted underline-offset-2 hover:underline"
                      >
                        <RotateCcw className="size-3" aria-hidden />
                        取り消す
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setPaid(p.id, p.name, true)}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 bg-surface-2 text-xs font-bold text-text hover:border-white/30 disabled:opacity-50"
                  >
                    {isHost ? "受け取った" : "払った"}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mx-4 mt-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}

      {isHost && (
        <>
          <section className="mx-4 mt-4 rounded-3xl border panel px-5 py-5">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Users className="size-5" aria-hidden />
              みんなにこのページを送る
            </h2>
            <p className="mt-1 text-sm text-muted">払った人が自分で「払った」を押せるので、一人ずつ聞かなくて済みます</p>
            <SendButtons mainLabel="共有してみんなに送る" line={askText} share={{ text: askText }} copy={askText} copyLabel="送る文をコピー" canShare={canShare} />
          </section>

          {unpaid.length > 0 && (
            <section className="mx-4 mt-4 rounded-3xl border panel px-5 py-5">
              <h2 className="text-lg font-black">まだの人に催促する</h2>
              <p className="mt-1 text-xs text-muted">まだの{unpaid.length}人の名前と金額だけが入ります。払った人の名前は出ません</p>
              <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm leading-relaxed break-all whitespace-pre-wrap">{remind}</p>
              <SendButtons mainLabel="共有して催促を送る" line={remind} share={{ text: remind }} copy={remind} copyLabel="催促の文をコピー" canShare={canShare} />
            </section>
          )}
          <p className="mx-4 mt-3 text-xs text-muted">
            現金で受け取ったときは「受け取った」を押してください。参加した人の押し間違いも、幹事なら取り消せます
          </p>
        </>
      )}
    </>
  );
}
