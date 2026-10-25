import type { MetadataRoute } from "next";

// ホーム画面に追加したときの名前とアイコン。アイコンは public/date-icon.svg から scripts/make-icons.mjs で書き出す
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Date 仙台の飲み会セッティング",
    short_name: "Date",
    description: "伊達(仙台)と date(日にち)をかけた名前。飲み会の日にち・予算・お店が、URLを貼るだけで決まる",
    lang: "ja",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0a09",
    theme_color: "#0b0a09",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
