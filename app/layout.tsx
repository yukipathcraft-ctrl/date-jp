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
  title: { default: "nomi | 仙台の飲み会セッティング", template: "%s | nomi" },
  description:
    "日にち・時間・予算・場所・何時まで残れるかを、みんなが30秒で答えるだけ。仙台のお店まで決まる、学生と社会人のための飲み会セッティング",
  applicationName: "nomi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0a09",
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
