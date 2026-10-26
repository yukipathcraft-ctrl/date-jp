// ボタン・入力欄・カードの共通の見た目。押せる場所は高さ48以上にする
export const CARD = "mx-4 rounded-3xl border lux";
export const BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-base font-bold transition-[color,background-color,border-color,transform,filter] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100";
/** 主ボタン。金の面に上から光が当たったような濃淡と、下にほのかな金の光 */
export const BUTTON_PRIMARY = `${BUTTON} min-h-14 bg-[linear-gradient(180deg,#ffd57f,var(--accent)_55%,#dc9d27)] text-accent-text shadow-[0_12px_32px_-12px_rgb(245_184_61/0.65),inset_0_1px_0_rgb(255_255_255/0.4)] hover:brightness-110`;
export const BUTTON_SUB = `${BUTTON} border border-border bg-surface-2 text-text hover:border-muted`;
export const BUTTON_LINE = `${BUTTON} border-2 border-line bg-surface-2 text-line-strong hover:border-line-strong`;
export const INPUT =
  "min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-5 text-base outline-none placeholder:text-muted focus:border-accent";
/** 選ぶ丸いボタン。選んだものは金色の地に黒い文字(✓も付ける) */
export const PILL =
  "inline-flex min-h-11 items-center justify-center gap-1 rounded-full border px-4 text-sm font-bold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.95]";
export const PILL_ON = "border-accent bg-[linear-gradient(180deg,#ffd57f,var(--accent)_60%)] text-accent-text shadow-[0_6px_18px_-8px_rgb(245_184_61/0.7)]";
/** 選んでいないもの。暗い地でも読めるよう、文字は白に近くし、枠も見える明るさにする */
export const PILL_OFF = "border-white/15 bg-surface-2 text-text hover:border-white/30";
/** カードの中の項目名。小さな線画のアイコンを添える */
export const LABEL = "mb-3 flex items-center gap-2 text-sm font-bold text-text";
