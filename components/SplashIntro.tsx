import { CRESCENT_PATH } from "./Logo";

// 起動の演出(約3.2秒)
// 左右から金の線で描いたグラスが勢いよく飛んできて、真ん中で乾杯する。
// ぶつかった瞬間に画面が揺れて光り、その衝撃から伊達の三日月が刀を振ったように一閃で走る。
// グラスが下に退くと、一閃の線の下から「Date」がせり上がる。
// 動きは globals.css の .intro-* に置く。動きを減らす設定の人には出さない(HomeClient で判定)

const NAME = "Date";

// 乾杯の瞬間の集中線。角度だけ決めておく
const LINES = [-150, -120, -90, -60, -30, 30, 150];

function Glass({ side }: { side: "left" | "right" }) {
  return (
    <svg viewBox="0 0 60 90" className="h-32 w-[5.4rem]" aria-hidden style={side === "right" ? { transform: "scaleX(-1)" } : undefined}>
      <defs>
        <clipPath id={`intro-glass-${side}`}>
          <path d="M10 18h40l-4 60a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" />
        </clipPath>
      </defs>
      <rect className="intro-pour" x="6" y="30" width="48" height="60" fill="var(--accent)" clipPath={`url(#intro-glass-${side})`} />
      <path
        d="M10 18h40l-4 60a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z"
        fill="none"
        stroke="var(--text)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
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
      <span aria-hidden className="intro-flash pointer-events-none absolute inset-0" />

      <span className="intro-stage absolute inset-0 flex flex-col items-center justify-center">
        {/* 乾杯と三日月は同じ場所で重ねる */}
        <span className="relative grid h-36 w-72 place-items-center">
          <span aria-hidden className="absolute top-1/2 left-1/2">
            {LINES.map((deg) => (
              <span key={deg} className="intro-line absolute h-[3px] w-20 origin-left rounded-full bg-text" style={{ rotate: `${deg}deg` }} />
            ))}
          </span>
          <span className="intro-glass-left absolute">
            <Glass side="left" />
          </span>
          <span className="intro-glass-right absolute">
            <Glass side="right" />
          </span>
          <svg viewBox="0 0 240 120" className="intro-moon absolute w-72" aria-hidden>
            <path className="intro-moon-path" pathLength="1" d={CRESCENT_PATH} fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </span>

        <span className="relative mt-2 flex flex-col items-center">
          <span aria-hidden className="intro-slash absolute top-0 h-px w-[min(80vw,26rem)] bg-accent" />
          <span className="flex overflow-hidden pt-3" aria-hidden>
            {NAME.split("").map((c, i) => (
              <span
                key={i}
                className="intro-letter inline-block text-7xl font-extrabold tracking-tight text-text"
                style={{ animationDelay: `${1.45 + i * 0.06}s` }}
              >
                {c}
              </span>
            ))}
          </span>
        </span>

        <span className="sr-only">{NAME}</span>
      </span>
    </button>
  );
}
