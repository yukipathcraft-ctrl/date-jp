import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const jp = Noto_Sans_JP({
  // もとにした KANJI と同じく、見出しはいちばん太い字(900)を使う
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jp",
});

export const metadata: Metadata = {
  title: { default: "Date | 仙台の飲み会セッティング", template: "%s | Date" },
  description:
    "URLをLINEに貼ってみんなが30秒で答えるだけで、仙台での飲み会の日にちと予算とお店が決まります",
  applicationName: "Date",
  appleWebApp: { title: "Date", statusBarStyle: "black-translucent", capable: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${jp.variable} h-full antialiased`}>
      <body className="min-h-full">
        <main>{children}</main>
      </body>
    </html>
  );
}
