// ボタン・入力欄・帯の共通の見た目。押せる場所は高さ48以上にする
export const BAND = "bg-surface border-y border-border px-4 py-5";
export const BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold transition-colors disabled:opacity-50";
export const BUTTON_PRIMARY = `${BUTTON} bg-accent text-accent-text hover:bg-accent-strong`;
export const BUTTON_SUB = `${BUTTON} border border-border bg-surface text-text hover:bg-surface-2`;
export const BUTTON_LINE = `${BUTTON} border-2 border-line bg-surface text-line-strong hover:bg-surface-2`;
export const INPUT =
  "min-h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-base outline-none focus:border-accent";
