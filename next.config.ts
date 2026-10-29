import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発中、2人目の端末の代わりに 127.0.0.1 からも開けるようにする(localStorage が別になる)
  allowedDevOrigins: ["127.0.0.1"],
  // 紹介料の付くリンクを使っているかどうかだけを、画面(components/PrNote.tsx)に渡す。リンクの中身は渡さない
  env: { AFFILIATE_ON: process.env.AFFILIATE_URL_TEMPLATE?.includes("{url}") ? "1" : "" },
  images: { remotePatterns: [{ protocol: "https", hostname: "imgfp.hotp.jp" }] },
  async headers() {
    return [
      {
        // 飲み会のページは検索エンジンに載せない
        source: "/p/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
