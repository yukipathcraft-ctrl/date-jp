// ロゴ: 伊達政宗の兜の前立て(三日月)。黒い角丸の四角に金の弧を置く
/** 三日月の形(viewBox 0 0 240 120)。右の先を長く上げて、笑った口に見えないようにする */
export const CRESCENT_PATH = "M8 50C46 124 184 124 236 4C182 104 62 112 8 50Z";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="62" height="62" rx="16" fill="#171513" stroke="color-mix(in srgb, var(--accent) 40%, transparent)" strokeWidth="2" />
      <path d="M9 27C20 52 45 52 56 14C45 44 22 46 9 27Z" fill="var(--accent)" />
    </svg>
  );
}

/** ロゴの横に並べる名前。表記はほかの場所と同じ「Date」にし、欧文の字体(Playfair Display)で書く */
export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-logo leading-none font-bold tracking-[0.02em] text-white" style={{ fontSize: Math.round(size * 0.9) }}>
        Date
      </span>
    </span>
  );
}
