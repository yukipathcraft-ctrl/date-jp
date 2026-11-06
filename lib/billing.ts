import "server-only";
import { cleanEnv } from "./env";
import { signLicense, verifyLicense } from "./license";

// 買い切りの有料プラン(傾斜の会計と、集金のページ)。Stripe のお会計のページ(Checkout)を使い、カードの情報はこちらで持たない。
// STRIPE_SECRET_KEY と LICENSE_SECRET がそろうまでは、有料にせず誰でも全部使える。
// 支払いのあとは /pro/done に戻り、Stripe に支払いを確かめてから、端末に鍵(lib/license.ts)を渡す

/** 値段(円・税込)。PRO_PRICE で変えられる */
export function proPrice(): number {
  const n = Number(cleanEnv(process.env.PRO_PRICE));
  return Number.isInteger(n) && n >= 100 ? n : 980;
}

const API = "https://api.stripe.com/v1";

function secretKey(): string | null {
  return cleanEnv(process.env.STRIPE_SECRET_KEY);
}

function licenseSecret(): string | null {
  return cleanEnv(process.env.LICENSE_SECRET);
}

/** 有料にしているか(Stripe のキーと、鍵に署名する秘密が入っているか) */
export function billingEnabled(): boolean {
  return secretKey() !== null && licenseSecret() !== null;
}

/** この端末が使えるか。有料にしていなければ、いつでも使える */
export function hasPro(license: unknown): boolean {
  const secret = licenseSecret();
  if (!billingEnabled() || !secret) return true;
  return verifyLicense(license, secret);
}

async function stripe(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/x-www-form-urlencoded", ...init.headers },
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`stripe ${res.status} ${JSON.stringify(body.error ?? {})}`);
  return body;
}

/** お会計のページを作り、その URL を返す。origin はこのサイトの URL、back は買ったあとに戻るページ */
export async function createProCheckout(origin: string, back: string): Promise<string> {
  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "jpy",
    "line_items[0][price_data][unit_amount]": String(proPrice()),
    "line_items[0][price_data][product_data][name]": "Date 会計・集金の全部の機能(買い切り)",
    // 別の端末で使うときに、メールアドレスから買ったことを確かめられるようにする
    customer_creation: "always",
    "metadata[kind]": "pro",
    success_url: `${origin}/pro/done?session={CHECKOUT_SESSION_ID}&back=${encodeURIComponent(back)}`,
    cancel_url: `${origin}${back}`,
  });
  const session = await stripe("/checkout/sessions", { method: "POST", body: params.toString() });
  if (typeof session.url !== "string") throw new Error("stripe: お会計のページの URL がありません");
  return session.url;
}

function isPaidPro(session: Record<string, unknown>): boolean {
  return session.payment_status === "paid" && (session.metadata as Record<string, string> | undefined)?.kind === "pro";
}

/** 支払いが済んでいれば、端末に渡す鍵を返す */
export async function licenseForSession(sessionId: string): Promise<string | null> {
  const secret = licenseSecret();
  if (!secret || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  const session = await stripe(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
  return isPaidPro(session) ? signLicense(sessionId, secret) : null;
}

/** 買ったときのメールアドレスから、支払いを探して鍵を返す(別の端末で使うとき) */
export async function licenseForEmail(email: string): Promise<string | null> {
  const secret = licenseSecret();
  if (!secret) return null;
  const customers = await stripe(`/customers?email=${encodeURIComponent(email)}&limit=10`);
  for (const c of (customers.data as { id: string }[] | undefined) ?? []) {
    const sessions = await stripe(`/checkout/sessions?customer=${encodeURIComponent(c.id)}&limit=20`);
    const paid = ((sessions.data as Record<string, unknown>[] | undefined) ?? []).find(isPaidPro);
    if (paid && typeof paid.id === "string") return signLicense(paid.id, secret);
  }
  return null;
}
