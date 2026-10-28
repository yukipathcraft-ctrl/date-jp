import { afterEach, describe, expect, it, vi } from "vitest";
import { billingEnabled, createStatementCheckout, paidCollection, STATEMENT_PRICE } from "./billing";

// Stripe には実際につながず、fetch を差し替えて、送る中身と受け取り方を確かめる

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function fakeFetch(body: unknown, ok = true) {
  const fn = vi.fn(async () => ({ ok, status: ok ? 200 : 400, json: async () => body }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("billingEnabled", () => {
  it("Stripe のキーがなければ有料にしない", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(billingEnabled()).toBe(false);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    expect(billingEnabled()).toBe(true);
  });
});

describe("createStatementCheckout", () => {
  it("300円・円・集金の id を付けてお会計のページを作り、幹事の鍵は戻り先に入れない", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    const fetch = fakeFetch({ url: "https://checkout.stripe.com/c/pay/abc" });
    const url = await createStatementCheckout("col123", "歓迎会", "https://date.example");
    expect(url).toBe("https://checkout.stripe.com/c/pay/abc");
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const sent = new URLSearchParams(String(init.body));
    expect(sent.get("line_items[0][price_data][unit_amount]")).toBe(String(STATEMENT_PRICE));
    expect(sent.get("line_items[0][price_data][currency]")).toBe("jpy");
    expect(sent.get("metadata[collectionId]")).toBe("col123");
    expect(sent.get("success_url")).toBe("https://date.example/c/col123/paid?session={CHECKOUT_SESSION_ID}");
    expect(sent.get("success_url")).not.toContain("token");
  });
});

describe("paidCollection", () => {
  it("払い済みなら集金の id を返し、まだなら null", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    fakeFetch({ payment_status: "paid", metadata: { collectionId: "col123" } });
    expect(await paidCollection("cs_test_1")).toBe("col123");
    fakeFetch({ payment_status: "unpaid", metadata: { collectionId: "col123" } });
    expect(await paidCollection("cs_test_1")).toBeNull();
  });
  it("形のおかしい id は Stripe に聞かずに null", async () => {
    const fetch = fakeFetch({});
    expect(await paidCollection("../evil")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
