// 起動の演出: ジョッキの線が描かれ、金色のビールが下から満ち、泡が立って、「nomi」の文字が浮かぶ。
// 動きは globals.css の .intro-* に置く。動きを減らす設定の人には出さない(HomeClient で判定)

export function SplashIntro({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="はじめる"
      className="intro-root fixed inset-0 z-50 grid cursor-default place-items-center bg-bg"
    >
      <span aria-hidden className="intro-halo pointer-events-none absolute size-[36rem] rounded-full" />
      <span className="relative flex flex-col items-center">
        <svg viewBox="0 0 120 120" className="size-40" aria-hidden>
          <defs>
            <clipPath id="intro-mug">
              <path d="M30 40h50v42a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" />
            </clipPath>
            <linearGradient id="intro-beer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd36b" />
              <stop offset="1" stopColor="#e89a1c" />
            </linearGradient>
          </defs>
          {/* ビールが満ちる */}
          <g clipPath="url(#intro-mug)">
            <rect className="intro-fill" x="28" y="38" width="54" height="56" fill="url(#intro-beer)" />
            <circle className="intro-bubble" style={{ animationDelay: "0.9s" }} cx="42" cy="86" r="2" fill="#fff6d8" />
            <circle className="intro-bubble" style={{ animationDelay: "1.05s" }} cx="55" cy="88" r="1.6" fill="#fff6d8" />
            <circle className="intro-bubble" style={{ animationDelay: "1.2s" }} cx="67" cy="86" r="2.2" fill="#fff6d8" />
            <circle className="intro-bubble" style={{ animationDelay: "1.35s" }} cx="48" cy="88" r="1.4" fill="#fff6d8" />
          </g>
          {/* 泡 */}
          <g className="intro-foam" fill="#fff8e6">
            <circle cx="36" cy="38" r="8" />
            <circle cx="48" cy="33" r="10" />
            <circle cx="62" cy="34" r="9" />
            <circle cx="74" cy="38" r="8" />
            <rect x="30" y="36" width="50" height="8" rx="4" />
          </g>
          {/* ジョッキの線 */}
          <g fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path className="intro-draw" pathLength="1" d="M30 40v42a8 8 0 0 0 8 8h34a8 8 0 0 0 8-8V40" />
            <path className="intro-draw" pathLength="1" style={{ animationDelay: "0.25s" }} d="M80 50h8a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8h-8" />
          </g>
          {/* きらり */}
          <path
            className="intro-spark"
            d="M100 22l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z"
            fill="#fff3c4"
          />
        </svg>

        <span className="mt-6 flex text-6xl font-extrabold tracking-tight text-text" aria-hidden>
          {"nomi".split("").map((c, i) => (
            <span key={i} className="intro-letter inline-block" style={{ animationDelay: `${1.25 + i * 0.08}s` }}>
              {c}
            </span>
          ))}
        </span>
        <span className="intro-tagline mt-3 text-sm font-bold tracking-[0.3em] text-muted">仙台の飲み会セッティング</span>
        <span className="sr-only">nomi 仙台の飲み会セッティング</span>
      </span>
    </button>
  );
}
