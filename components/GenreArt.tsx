import type { GenreKey } from "@/lib/sendai";

// 決まったお店のカードに出す、料理の種類ごとの絵。
// ホットペッパーの写真はお店が選んだ1枚だけで、広告の画像のことがあるので、写真の代わりに自分で描いた絵を出す。
// 金の線で描き、黒い地でも明るい地でも同じに見えるようにする(飾りなので読み上げない)

const LINE = { fill: "none", stroke: "var(--accent)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** 居酒屋: ジョッキと焼き鳥 */
function Izakaya() {
  return (
    <g {...LINE}>
      <path d="M110 70h44v62a8 8 0 0 1-8 8h-28a8 8 0 0 1-8-8z" />
      <path d="M154 84h10a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10h-10" />
      <path d="M108 70c0-10 8-14 14-12 4-8 16-8 20-2 8-4 16 2 14 14" />
      <path d="M122 92v34M138 92v34" opacity="0.5" />
      <path d="M196 50l20 96" />
      <rect x="196" y="66" width="22" height="14" rx="6" transform="rotate(-12 207 73)" />
      <rect x="200" y="86" width="22" height="14" rx="6" transform="rotate(-12 211 93)" />
      <rect x="204" y="106" width="22" height="14" rx="6" transform="rotate(-12 215 113)" />
    </g>
  );
}

/** 和食: 徳利とおちょこ、にぎり */
function Washoku() {
  return (
    <g {...LINE}>
      <path d="M112 56h12v10c14 8 18 24 18 40 0 18-8 30-24 30s-24-12-24-30c0-16 4-32 18-40z" />
      <path d="M150 116h24l-4 18h-16z" />
      <rect x="186" y="104" width="52" height="22" rx="11" />
      <path d="M190 104c6-12 38-12 44 0" />
      <path d="M200 104v22M222 104v22" opacity="0.5" />
      <path d="M176 142h76" />
    </g>
  );
}

/** 洋食: ワイングラスとお皿 */
function Yoshoku() {
  return (
    <g {...LINE}>
      <path d="M112 52h32c0 26-6 40-16 40s-16-14-16-40z" />
      <path d="M128 92v40M114 136h28" />
      <path d="M116 70h24" opacity="0.5" />
      <circle cx="206" cy="104" r="34" />
      <circle cx="206" cy="104" r="20" opacity="0.5" />
      <path d="M256 70v68M250 70v16a6 6 0 0 0 12 0V70" />
    </g>
  );
}

/** 中華: 蒸籠と餃子 */
function Chuka() {
  return (
    <g {...LINE}>
      <path d="M96 96h72v32a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8z" />
      <path d="M92 96h80M104 80h56l8 16H96z" />
      <path d="M118 112h28" opacity="0.5" />
      <path d="M186 124c0-20 16-30 32-30s32 10 32 30z" />
      <path d="M196 112c4 4 8 4 10 0M210 106c4 4 8 4 10 0M224 108c4 4 8 4 10 0" opacity="0.6" />
      <path d="M180 132h76" />
    </g>
  );
}

/** 焼肉: 網とお肉 */
function Yakiniku() {
  return (
    <g {...LINE}>
      <circle cx="160" cy="100" r="46" />
      <path d="M126 70v60M148 56v88M172 56v88M194 70v60" opacity="0.5" />
      <path d="M120 86h80M114 108h92" opacity="0.5" />
      <path d="M136 82c10-6 26-4 30 4s-6 14-18 14-18-12-12-18z" />
      <path d="M166 104c10-4 24 0 26 8s-8 12-18 10-14-14-8-18z" />
      <path d="M146 148c6 8 22 8 28 0" />
    </g>
  );
}

/** 種類が分からないお店: 乾杯のグラス */
function Cheers() {
  return (
    <g {...LINE}>
      <path d="M118 60h30l-4 64h-22z" transform="rotate(-10 133 92)" />
      <path d="M172 60h30l-4 64h-22z" transform="rotate(10 187 92)" />
      <path d="M156 44v-10M146 48l-6-8M166 48l6-8" />
      <path d="M110 140h100" opacity="0.5" />
    </g>
  );
}

const ART: Record<GenreKey, () => React.ReactElement> = {
  izakaya: Izakaya,
  washoku: Washoku,
  yoshoku: Yoshoku,
  chuka: Chuka,
  yakiniku: Yakiniku,
};

export function GenreArt({ genre }: { genre: GenreKey | null }) {
  const Art = genre ? ART[genre] : Cheers;
  return (
    <svg viewBox="0 0 320 180" className="aspect-[16/9] w-full rounded-2xl bg-bg/50" aria-hidden>
      {/* 奥にうっすら丸い光を置き、絵を浮かせる */}
      <circle cx="160" cy="96" r="78" fill="var(--accent)" opacity="0.06" />
      <Art />
    </svg>
  );
}
