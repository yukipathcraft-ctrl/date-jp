// ボタン・入力欄・カードの共通の見た目。押せる場所は高さ48以上にする
export const CARD = "mx-4 rounded-3xl border panel";
export const BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-base font-bold transition-[color,background-color,border-color,transform,filter] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100";
/** 主ボタン。墨の面に金のいちばん太い字。押せないときは薄い面に灰色の字(読める濃さ) */
export const BUTTON_PRIMARY = `${BUTTON} min-h-14 bg-accent font-black tracking-tight text-accent-text hover:bg-accent-strong disabled:bg-surface-2 disabled:text-muted disabled:ring-1 disabled:ring-border disabled:opacity-100`;
export const BUTTON_SUB = `${BUTTON} bg-surface text-text ring-1 ring-border-strong hover:bg-surface-2`;
export const BUTTON_LINE = `${BUTTON} border-2 border-line bg-surface text-line-strong hover:border-line-strong`;
export const INPUT =
  "min-h-14 w-full rounded-2xl bg-surface px-4 text-base text-text outline-none ring-1 ring-border-strong transition placeholder:text-[#8a8274] focus:ring-2 focus:ring-match";
/** 選ぶ丸いボタン。選んだものは墨の地に金の文字(✓も付ける) */
export const PILL =
  "inline-flex min-h-11 items-center justify-center gap-1 rounded-full border px-4 text-sm font-bold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.95]";
export const PILL_ON = "border-accent bg-accent text-accent-text";
/** 選んでいないもの。白い地に、はっきり見える枠で「押せる」と分かるようにする */
export const PILL_OFF = "border-border-strong bg-surface text-text hover:bg-surface-2";
/** カードの中の項目名。小さな線画のアイコンを添える */
export const LABEL = "mb-3 flex items-center gap-2 text-sm font-bold text-white/70";
/** 区切りの見出し。もとにした KANJI と同じく、小さく字の間を広げた灰色の字 */
export const SECTION_LABEL = "flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-muted";
