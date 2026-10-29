import "server-only";
import { ImageResponse } from "next/og";

// LINE などに貼ったときのプレビュー画像(1200×630)。文字は入れず、アプリのアイコン(public/date-icon.svg)だけを真ん中に置く。
// 会の名前や日時は、プレビューの見出しと説明(ページの title と description)で伝わる

export const OG_SIZE = { width: 1200, height: 630 };

/** 三日月の形。public/date-icon.svg と同じ */
const MOON = "M92 214C150 392 362 392 446 118C368 318 172 336 92 214Z";

export function ogImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0a09",
        }}
      >
        <svg width="380" height="380" viewBox="0 0 512 512" style={{ borderRadius: 84 }}>
          <defs>
            <radialGradient id="bg" cx="50%" cy="58%" r="70%">
              <stop offset="0" stopColor="#2a2010" />
              <stop offset="0.6" stopColor="#141210" />
              <stop offset="1" stopColor="#0b0a09" />
            </radialGradient>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffd77a" />
              <stop offset="1" stopColor="#e9a227" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="112" fill="url(#bg)" stroke="rgba(245,184,61,0.25)" strokeWidth="3" />
          <path d={MOON} fill="url(#gold)" />
        </svg>
      </div>
    ),
    OG_SIZE,
  );
}
