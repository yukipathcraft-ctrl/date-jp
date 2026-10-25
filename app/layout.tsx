import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const latin = Inter({ subsets: ["latin"], display: "swap", variable: "--font-latin" });
const jp = Noto_Sans_JP({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jp",
});

export const metadata: Metadata = {
  title: { default: "Nomise | 仙台の飲み会、URLを貼るだけで決まる", template: "%s | Nomise" },
  description:
    "日にち・時間・予算・場所・何時まで残れるかを、みんなが30秒で答えるだけ。仙台のお店まで決まる、学生のための飲み会セッティング",
  applicationName: "Nomise",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${latin.variable} ${jp.variable} h-full antialiased`}>
      <body className="min-h-full">
        <main>{children}</main>
      </body>
    </html>
  );
}
