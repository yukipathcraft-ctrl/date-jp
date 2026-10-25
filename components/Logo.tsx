// ロゴ: 金色の線で描いたジョッキ。角丸の黒い四角の中に置く
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="62" height="62" rx="16" fill="#171513" stroke="color-mix(in srgb, var(--accent) 45%, transparent)" strokeWidth="2" />
      <g fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {/* 泡 */}
        <path d="M18 22c0-4 3-7 7-7 2-3 6-4 9-2 3-2 8-1 10 3 3 0 5 3 4 6" />
        {/* 胴と取っ手 */}
        <path d="M19 22v24a4 4 0 0 0 4 4h18a4 4 0 0 0 4-4V22" />
        <path d="M45 28h4a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-4" />
        {/* 中の線 */}
        <path d="M27 30v12M35 30v12" />
      </g>
    </svg>
  );
}
