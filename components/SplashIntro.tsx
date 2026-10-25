import type { CSSProperties } from "react";

// 起動の演出(約3.4秒): 左右からビールのジョッキが飛んできて、真ん中で乾杯する。
// ぶつかった瞬間に画面が光り、金色の粒としずくが飛び散り、泡があふれる。
// そのあと名前が大きく落ちてきて、光が文字の上を走り、全体がふわっと消える。
// 動きは globals.css の .intro-* に置く。動きを減らす設定の人には出さない(HomeClient で判定)

const NAME = "Date";

// 飛び散る粒。角度と距離を決めておく(毎回同じ形にする)
const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08);
  const dist = 90 + ((i * 37) % 70);
  return {
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist),
    size: 4 + ((i * 13) % 6),
    delay: (i % 4) * 0.03,
  };
});

// 光の筋
const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

function Mug({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 100 110" className="h-28 w-[6.5rem]" aria-hidden style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <defs>
        <clipPath id={`intro-mug-${flip ? "r" : "l"}`}>
          <path d="M14 34h52v52a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10z" />
        </clipPath>
        <linearGradient id={`intro-beer-${flip ? "r" : "l"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd86e" />
          <stop offset="1" stopColor="#e3901a" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#intro-mug-${flip ? "r" : "l"})`}>
        <rect className="intro-fill" x="10" y="32" width="62" height="70" fill={`url(#intro-beer-${flip ? "r" : "l"})`} />
        <circle className="intro-bubble" style={{ animationDelay: "0.35s" }} cx="28" cy="88" r="2.4" fill="#fff6d8" />
        <circle className="intro-bubble" style={{ animationDelay: "0.5s" }} cx="44" cy="92" r="1.8" fill="#fff6d8" />
        <circle className="intro-bubble" style={{ animationDelay: "0.62s" }} cx="54" cy="90" r="2.6" fill="#fff6d8" />
      </g>
      {/* 泡。乾杯であふれる */}
      <g className="intro-foam" fill="#fff8e6">
        <circle cx="20" cy="33" r="9" />
        <circle cx="34" cy="27" r="11" />
        <circle cx="50" cy="28" r="10" />
        <circle cx="62" cy="33" r="8" />
        <rect x="13" y="31" width="54" height="9" rx="4.5" />
        <path className="intro-drip" d="M60 38c0 6 3 9 3 13a3 3 0 0 1-6 0c0-4 3-7 3-13z" />
      </g>
      <g fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 34v52a10 10 0 0 0 10 10h32a10 10 0 0 0 10-10V34" />
        <path d="M66 46h9a9 9 0 0 1 9 9v14a9 9 0 0 1-9 9h-9" />
      </g>
    </svg>
  );
}

export function SplashIntro({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="はじめる"
      className="intro-root fixed inset-0 z-50 cursor-default overflow-hidden bg-bg"
    >
      {/* ぶつかった瞬間の光 */}
      <span aria-hidden className="intro-flash pointer-events-none absolute inset-0" />
      <span aria-hidden className="intro-halo pointer-events-none absolute top-1/2 left-1/2 size-[40rem] rounded-full" />

      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="intro-stage relative flex h-32 w-80 items-center justify-center">
          {/* 光の筋と粒は乾杯の位置(真ん中の上)から出る */}
          <span aria-hidden className="absolute top-6 left-1/2">
            {RAYS.map((deg) => (
              <span key={deg} className="intro-ray absolute h-1 w-24 origin-left rounded-full" style={{ rotate: `${deg}deg` }} />
            ))}
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className="intro-particle absolute rounded-full"
                style={
                  {
                    width: p.size,
                    height: p.size,
                    "--dx": `${p.dx}px`,
                    "--dy": `${p.dy}px`,
                    animationDelay: `${0.95 + p.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
          {/* 取っ手は外側(手で持つ側)に向ける */}
          <span className="intro-mug-left absolute">
            <Mug flip />
          </span>
          <span className="intro-mug-right absolute">
            <Mug />
          </span>
        </span>

        <span className="intro-name relative mt-6 flex text-7xl font-extrabold tracking-tight" aria-hidden>
          {NAME.split("").map((c, i) => (
            <span key={i} className="intro-letter inline-block" style={{ animationDelay: `${1.35 + i * 0.07}s` }}>
              {c}
            </span>
          ))}
        </span>
        <span className="intro-tagline mt-3 text-sm font-bold tracking-[0.3em] text-muted">仙台の飲み会セッティング</span>
        <span className="intro-tagline mt-2 text-xs font-bold tracking-[0.3em] text-accent">伊達 × date</span>
        <span className="sr-only">{NAME} 仙台の飲み会セッティング</span>
      </span>
    </button>
  );
}
