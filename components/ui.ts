// ボタン・入力欄・カードの共通の見た目。押せる場所は高さ48以上にする
export const CARD = "mx-4 rounded-3xl border panel";
export const BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-base font-bold transition-[color,background-color,border-color,transform,filter] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100";
/** 主ボタン。もとにした KANJI と同じく、金一色の面にいちばん太い字。押せないときは白10%の面 */
export const BUTTON_PRIMARY = `${BUTTON} min-h-14 bg-accent font-black tracking-tight text-accent-text hover:bg-accent-strong disabled:bg-white/10 disabled:text-white/30 disabled:opacity-100`;
export const BUTTON_SUB = `${BUTTON} bg-white/8 text-text ring-1 ring-white/12 hover:bg-white/12`;
export const BUTTON_LINE = `${BUTTON} border-2 border-line bg-surface-2 text-line-strong hover:border-line-strong`;
export const INPUT =
  "min-h-14 w-full rounded-2xl bg-white/8 px-4 text-base text-white outline-none ring-1 ring-white/12 transition placeholder:text-white/25 focus:ring-accent/50";
/** 選ぶ丸いボタン。選んだものは金色の地に黒い文字(✓も付ける) */
export const PILL =
  "inline-flex min-h-11 items-center justify-center gap-1 rounded-full border px-4 text-sm font-bold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.95]";
export const PILL_ON = "border-accent bg-accent text-accent-text";
/** 選んでいないもの。暗い地でも読めるよう、文字は白に近くし、枠も見える明るさにする */
export const PILL_OFF = "border-white/12 bg-white/8 text-text hover:bg-white/12";
/** カードの中の項目名。小さな線画のアイコンを添える */
export const LABEL = "mb-3 flex items-center gap-2 text-sm font-bold text-white/70";
/** 区切りの見出し。もとにした KANJI と同じく、小さく字の間を広げた灰色の字 */
export const SECTION_LABEL = "flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-stone-400";
