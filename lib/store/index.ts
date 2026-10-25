import "server-only";
import { cleanEnv } from "../env";
import { memoryStore } from "./memory";
import { createSupabaseStore } from "./supabase";
import type { Store } from "./types";

let store: Store | undefined;

export function getStore(): Store {
  if (store) return store;

  const url = cleanEnv(process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const isProduction = process.env.NODE_ENV === "production";
  if (process.env.STORE === "memory" && !isProduction) {
    // STORE=memory で、.env.local があっても仮DBを使う(画面確認用)
    store = memoryStore;
  } else if (url && key) {
    store = createSupabaseStore(url, key);
  } else if (!isProduction) {
    console.warn("[store] SUPABASE_URL が未設定のため、開発用の仮DB(メモリ)を使います");
    store = memoryStore;
  } else {
    throw new Error("SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください");
  }
  return store;
}
