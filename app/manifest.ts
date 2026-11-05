import type { MetadataRoute } from "next";

// ホーム画面に追加したときの名前とアイコン。アイコンは public/date-icon.svg から scripts/make-icons.mjs で書き出す
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Date 飲み会セッティング",
    short_name: "Date",
    description: "URLを貼るだけで、飲み会の日にちと予算とお店が決まります",
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
