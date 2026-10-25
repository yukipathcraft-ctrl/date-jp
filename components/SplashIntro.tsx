import { CRESCENT_PATH } from "./Logo";

// 起動の演出(約3秒): 伊達政宗の兜の三日月が、金の線で一筆に描かれる。
// 横に一閃の線が走り、その線の下から「Date」がせり上がって、「伊達 × date」が添えられる。
// 飾りの絵は使わず、三日月と文字だけで見せる。動きは globals.css の .intro-* に置く。
// 動きを減らす設定の人には出さない(HomeClient で判定)

const NAME = "Date";

export function SplashIntro({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="はじめる"
      className="intro-root fixed inset-0 z-50 cursor-default overflow-hidden bg-bg"
    >
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {/* 三日月(兜の前立て)。両端が上を向いた細く長い弧を、線で描いてから金で満たす */}
        <svg viewBox="0 0 240 120" className="intro-moon w-64" aria-hidden>
          <path
            className="intro-moon-path"
            pathLength="1"
            d={CRESCENT_PATH}
            fill="var(--accent)"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* 一閃の線と、その下からせり上がる名前 */}
        <span className="relative mt-4 flex flex-col items-center">
          <span aria-hidden className="intro-slash absolute top-0 h-px w-[min(80vw,26rem)] bg-accent" />
          <span className="intro-mask flex overflow-hidden pt-3" aria-hidden>
            {NAME.split("").map((c, i) => (
              <span
                key={i}
                className="intro-letter inline-block text-7xl font-extrabold tracking-tight text-text"
                style={{ animationDelay: `${1.05 + i * 0.06}s` }}
              >
                {c}
              </span>
            ))}
          </span>
        </span>

        <span className="intro-sub mt-5 text-sm font-bold tracking-[0.35em] text-accent">伊達 × date</span>
        <span className="intro-sub mt-2 text-xs font-bold tracking-[0.3em] text-muted" style={{ animationDelay: "1.75s" }}>
          仙台の飲み会セッティング
        </span>
        <span className="sr-only">{NAME} 伊達 × date 仙台の飲み会セッティング</span>
      </span>
    </button>
  );
}
