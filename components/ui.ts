// ボタン・入力欄・カードの共通の見た目。押せる場所は高さ48以上にする
export const CARD = "mx-4 rounded-3xl border border-border bg-surface";
export const BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-base font-bold transition-colors disabled:opacity-50";
export const BUTTON_PRIMARY = `${BUTTON} bg-gold min-h-14 text-accent-text shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]`;
export const BUTTON_SUB = `${BUTTON} border border-border bg-surface-2 text-text hover:border-muted`;
export const BUTTON_LINE = `${BUTTON} border-2 border-line bg-surface-2 text-line-strong hover:border-line-strong`;
export const INPUT =
  "min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-5 text-base outline-none placeholder:text-muted focus:border-accent";
/** 選ぶ丸いボタン。選んだものは金色の地に黒い文字(✓も付ける) */
export const PILL =
  "inline-flex min-h-11 items-center justify-center gap-1 rounded-full border px-4 text-sm font-bold transition-colors";
export const PILL_ON = "border-accent bg-accent text-accent-text";
export const PILL_OFF = "border-border bg-surface-2 text-muted hover:text-text";
/** カードの中の項目名。小さな線画のアイコンを添える */
export const LABEL = "mb-3 flex items-center gap-2 text-sm font-bold text-muted";
