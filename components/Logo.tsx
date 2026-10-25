// ロゴ: 伊達政宗の兜の前立て(三日月)。黒い角丸の四角に金の弧を置く
/** 三日月の形(viewBox 0 0 240 120)。右の先を長く上げて、笑った口に見えないようにする */
export const CRESCENT_PATH = "M8 50C46 124 184 124 236 4C182 104 62 112 8 50Z";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="62" height="62" rx="16" fill="#171513" stroke="color-mix(in srgb, var(--accent) 40%, transparent)" strokeWidth="2" />
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e3a1" />
          <stop offset="0.45" stopColor="#dcb862" />
          <stop offset="1" stopColor="#b98a33" />
        </linearGradient>
      </defs>
      <path d="M9 27C20 52 45 52 56 14C45 44 22 46 9 27Z" fill="url(#logo-gold)" />
    </svg>
  );
}

/** 区切りに使う、細い三日月の弧 */
export function CrescentRule({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 24" className={`h-3 w-24 ${className}`} aria-hidden>
      <path d="M4 4C40 26 200 26 236 4C190 18 50 18 4 4Z" fill="var(--accent)" />
    </svg>
  );
}
