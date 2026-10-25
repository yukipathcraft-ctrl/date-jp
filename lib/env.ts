const BOM = String.fromCharCode(0xfeff);

/** 環境変数を読む。貼り付けたときに混じる見えない文字(BOM・空白・改行)を取り除き、空なら null */
export function cleanEnv(value: string | undefined): string | null {
  const v = (value ?? "").split(BOM).join("").replace(/\s/g, "");
  return v === "" ? null : v;
}
