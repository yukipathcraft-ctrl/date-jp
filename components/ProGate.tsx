"use client";

import { Check, Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { buyPro, proStatus, restorePro } from "@/app/actions";
import { yen } from "@/lib/sendai";
import { BUTTON_PRIMARY, INPUT } from "./ui";

// 買い切りの「会計・集金の全部の機能」(傾斜で割る・集金のページ)。割り勘は無料のまま。
// 買った鍵はこの端末に保存する(ログインなし)。別の端末では、買ったときのメールアドレスで戻せる

const KEY = "date:pro";

export function loadLicense(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveLicense(license: string) {
  try {
    localStorage.setItem(KEY, license);
  } catch {}
}

export type ProAccess = { loading: boolean; enabled: boolean; unlocked: boolean; price: number; license: string | null };

/** この端末で有料の機能が使えるか。有料にしていなければ、いつでも使える */
export function useProAccess(): ProAccess {
  const [state, setState] = useState<ProAccess>({ loading: true, enabled: false, unlocked: true, price: 0, license: null });
  useEffect(() => {
    const license = loadLicense();
    proStatus(license)
      .then((s) => setState({ loading: false, ...s, license }))
      .catch(() => setState({ loading: false, enabled: false, unlocked: true, price: 0, license }));
  }, []);
  return state;
}

/** 有料の機能を使おうとしたときに出す案内。買う、または別の端末で買ったものを戻す */
export function ProPaywall({ feature, price, onClose }: { feature: string; price: number; onClose?: () => void }) {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [email, setEmail] = useState("");

  function buy() {
    setError(null);
    start(async () => {
      const r = await buyPro(pathname);
      if (r.ok) location.href = r.url;
      else setError(r.error);
    });
  }

  function restore() {
    setError(null);
    start(async () => {
      const r = await restorePro(email);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      saveLicense(r.license);
      location.reload();
    });
  }

  return (
    <section className="anim-rise mx-4 mt-4 rounded-3xl border border-accent/50 bg-surface px-5 py-6" aria-live="polite">
      <p className="flex items-center gap-2 text-lg font-black">
        <Lock className="size-5 text-accent" aria-hidden />
        {feature}は有料の機能
      </p>
      <p className="mt-1 text-sm text-muted">割り勘は無料のまま ・ 一度買えばずっと使える</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {["傾斜で割る(先輩・上司は多め)", "集金のページ(まだの人にだけ催促)", "これからの会計もずっと"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-accent" aria-hidden />
            {t}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      <button type="button" onClick={buy} disabled={pending} className={`${BUTTON_PRIMARY} mt-5 w-full`}>
        {pending && !restoring ? "お会計のページを開いています…" : `${yen(price)}で買う(買い切り)`}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        お支払いは Stripe のページで ・ カードの番号は Date に届かない ・{" "}
        <a href="/legal" className="underline underline-offset-2">
          特定商取引法に基づく表記
        </a>
      </p>
      {restoring ? (
        <div className="mt-4 flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">買ったときのメールアドレス</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="買ったときのメールアドレス" className={INPUT} />
          </label>
          <button type="button" onClick={restore} disabled={pending || !email.trim()} className="shrink-0 rounded-2xl bg-white/8 px-4 text-sm font-bold ring-1 ring-white/12 disabled:opacity-40">
            戻す
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setRestoring(true)} className="mx-auto mt-3 flex min-h-11 items-center px-3 text-xs font-bold text-muted underline underline-offset-2">
          ほかの端末で買った人はこちら
        </button>
      )}
      {onClose && (
        <button type="button" onClick={onClose} className="mx-auto flex min-h-11 items-center px-3 text-xs font-bold text-muted underline underline-offset-2">
          割り勘にもどる
        </button>
      )}
    </section>
  );
}
