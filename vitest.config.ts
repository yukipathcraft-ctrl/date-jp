import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "server-only": new URL("./lib/test/empty.ts", import.meta.url).pathname } },
});
