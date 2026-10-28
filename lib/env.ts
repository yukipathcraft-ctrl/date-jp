const BOM = String.fromCharCode(0xfeff);

/** 環境変数を読む。貼り付けたときに混じる見えない文字(BOM・空白・改行)を取り除き、空なら null */
export function cleanEnv(value: string | undefined): string | null {
  const v = (value ?? "").split(BOM).join("").replace(/\s/g, "");
  return v === "" ? null : v;
}

/** 名前や住所のような文の環境変数を読む。前後の空白と見えない文字(BOM)だけを取り除き(中の空白は残す)、空なら null */
export function cleanText(value: string | undefined): string | null {
  const v = (value ?? "").split(BOM).join("").trim();
  return v === "" ? null : v;
}
