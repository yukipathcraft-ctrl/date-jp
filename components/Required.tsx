/** 必須の項目の見出しに付ける赤い点。読み上げでは「必須」と読む */
export function Required() {
  return (
    <>
      <span aria-hidden className="inline-block size-1.5 shrink-0 rounded-full bg-red-500" />
      <span className="sr-only">(必須)</span>
    </>
  );
}
