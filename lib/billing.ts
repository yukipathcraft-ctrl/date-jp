import "server-only";
import { cleanEnv } from "./env";

// 有料の機能(経費精算の名簿と金額)の支払い。Stripe のお会計のページ(Checkout)を使い、カードの情報はこちらで持たない。
// STRIPE_SECRET_KEY がないあいだは、有料にせず今までどおり誰でも使える。
// 支払いのあとは /c/{id}/paid に戻り、Stripe に支払いを確かめてから使えるようにする(幹事の鍵は Stripe に渡さない)

/** 経費精算の名簿と金額の値段(円・税込)。会計1回分 */
export const STATEMENT_PRICE = 300;

const API = "https://api.stripe.com/v1";

function secretKey(): string | null {
  return cleanEnv(process.env.STRIPE_SECRET_KEY);
}

/** 有料にしているか(Stripe のキーが入っているか) */
export function billingEnabled(): boolean {
  return secretKey() !== null;
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

/** お会計のページを作り、その URL を返す。origin はこのサイトの URL(戻り先に使う) */
export async function createStatementCheckout(collectionId: string, title: string, origin: string): Promise<string> {
  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "jpy",
    "line_items[0][price_data][unit_amount]": String(STATEMENT_PRICE),
    "line_items[0][price_data][product_data][name]": `経費精算の名簿と金額${title ? `(${title.slice(0, 30)})` : ""}`,
    "metadata[collectionId]": collectionId,
    success_url: `${origin}/c/${collectionId}/paid?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/c/${collectionId}`,
  });
  const session = await stripe("/checkout/sessions", { method: "POST", body: params.toString() });
  if (typeof session.url !== "string") throw new Error("stripe: お会計のページの URL がありません");
  return session.url;
}

/** 支払いが済んだかを Stripe に確かめる。済んでいれば、どの集金の支払いかを返す */
export async function paidCollection(sessionId: string): Promise<string | null> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  const session = await stripe(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
  const id = (session.metadata as Record<string, string> | undefined)?.collectionId;
  return session.payment_status === "paid" && typeof id === "string" ? id : null;
}
