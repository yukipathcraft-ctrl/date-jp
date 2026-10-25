import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// 紛らわしい文字(0/o, 1/i/l)を除いた英数字
const ID_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export function generateGroupId(length = 10): string {
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  }
  return id;
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string | null | undefined, hash: string): boolean {
  if (!token) return false;
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
