import { createHmac, timingSafeEqual } from "node:crypto";

// 買い切りの「会計・集金の全部の機能」を、ログインなしで覚えておくための鍵。
// 支払いの id(Stripe のお会計の id)に、サーバーだけが知る秘密で署名したものを、端末に保存してもらう。
// DB には何も残さない。偽物は署名が合わないので通らない

function sign(sessionId: string, secret: string): string {
  return createHmac("sha256", secret).update(`pro:${sessionId}`).digest("base64url");
}

/** 鍵を作る。「支払いの id.署名」の形 */
export function signLicense(sessionId: string, secret: string): string {
  return `${sessionId}.${sign(sessionId, secret)}`;
}

/** 鍵が本物か。形がおかしいもの、署名が合わないものは false */
export function verifyLicense(license: unknown, secret: string): boolean {
  if (typeof license !== "string" || license.length > 300) return false;
  const dot = license.lastIndexOf(".");
  if (dot <= 0) return false;
  const sessionId = license.slice(0, dot);
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return false;
  const a = Buffer.from(license.slice(dot + 1));
  const b = Buffer.from(sign(sessionId, secret));
  return a.length === b.length && timingSafeEqual(a, b);
}
