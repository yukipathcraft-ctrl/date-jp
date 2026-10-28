// ロゴ: 伊達政宗の兜の前立て(三日月)。黒い角丸の四角に金の弧を置く
/** 三日月の形(viewBox 0 0 240 120)。右の先を長く上げて、笑った口に見えないようにする。小さく出しても見えるよう、真ん中を太めにする */
export const CRESCENT_PATH = "M8 50C46 124 184 124 236 4C182 96 62 102 8 50Z";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="62" height="62" rx="16" fill="#171513" stroke="color-mix(in srgb, var(--accent) 40%, transparent)" strokeWidth="2" />
      {/* 小さなロゴでも見えるよう、四角いっぱいに太く描く */}
      <path d="M7 26C18 56 46 56 58 12C45 40 22 42 7 26Z" fill="var(--accent)" />
    </svg>
  );
}

/** ロゴの横に並べる名前。起動したときに出る「Date」(components/SplashIntro.tsx)とそろえ、Poppins の太字を少し詰めて並べる */
export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-logo font-bold tracking-[-0.02em] text-white" style={{ fontSize: Math.round(size * 0.72) }}>
        Date
      </span>
    </span>
  );
}
