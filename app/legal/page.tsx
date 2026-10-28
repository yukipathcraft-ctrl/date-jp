import type { Metadata } from "next";
import { PageMotion } from "@/components/PageMotion";
import { SiteHeader } from "@/components/SiteHeader";
import { STATEMENT_PRICE } from "@/lib/billing";
import { cleanText } from "@/lib/env";
import { yen } from "@/lib/sendai";

export const metadata: Metadata = { title: "特定商取引法に基づく表記" };

// 有料の機能(経費精算の名簿と金額)を売るので、特定商取引法の表示を置く。
// 売る人の名前・住所・連絡先は個人の情報なので、コードには書かず環境変数(SELLER_*)から読む。
// 住所と電話は、請求があったときに開示する形でもよい(消費者庁の案内による)

const DISCLOSE = "請求があった場合には、遅滞なく開示いたします";

export default function LegalPage() {
  const rows: [string, string][] = [
    ["販売事業者", cleanText(process.env.SELLER_NAME) ?? "準備中"],
    ["運営責任者", cleanText(process.env.SELLER_NAME) ?? "準備中"],
    ["所在地", cleanText(process.env.SELLER_ADDRESS) ?? DISCLOSE],
    ["電話番号", cleanText(process.env.SELLER_PHONE) ?? DISCLOSE],
    ["メールアドレス", cleanText(process.env.SELLER_EMAIL) ?? "準備中"],
    ["販売価格", `経費精算の名簿と金額 ${yen(STATEMENT_PRICE)}(税込)・会計1回分`],
    ["商品代金以外の必要料金", "なし(インターネットの通信料はお客さまのご負担です)"],
    ["お支払い方法", "クレジットカード(Stripe による決済)"],
    ["お支払いの時期", "ご購入の手続きのときにお支払いが確定します"],
    ["商品の引き渡し時期", "お支払いが済んだすぐあとから、ご利用いただけます"],
    ["返品・キャンセル", "デジタルの商品のため、お支払いのあとの返品・キャンセルはお受けしていません。不具合で使えなかったときは、メールでご連絡ください"],
  ];
  return (
    <PageMotion>
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 pt-6 pb-16">
        <h1 className="text-[22px] font-black tracking-tight">特定商取引法に基づく表記</h1>
        <dl className="mt-5 divide-y divide-border rounded-3xl border panel">
          {rows.map(([k, v]) => (
            <div key={k} className="px-5 py-4">
              <dt className="text-xs font-bold text-muted">{k}</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageMotion>
  );
}
