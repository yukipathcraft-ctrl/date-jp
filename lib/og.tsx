import "server-only";
import { ImageResponse } from "next/og";
import { CRESCENT_PATH } from "@/components/Logo";

// LINE などに貼ったときのプレビュー画像(1200×630)。起動の演出と同じく、黒の地に金の三日月を大きく置く。
// 枠や飾りは細い金の線だけにして、色の面(ボタン風の枠)は使わない。
// 日本語の字は、使う文字だけの Noto Sans JP を Google Fonts から読み込む(読み込めなくても画像は出す)

export const OG_SIZE = { width: 1200, height: 630 };

const GOLD = "#f5b83d";
const GOLD_SOFT = "#c9a15a";
const INK = "#f4f1ec";
const MUTED = "#9a948b";
const HAIR = "rgba(245,184,61,0.28)";

async function loadFont(text: string, weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`, {
        cache: "force-cache",
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    if (!url) return null;
    return await (await fetch(url, { cache: "force-cache" })).arrayBuffer();
  } catch {
    return null;
  }
}

/** 長い会の名前は、カードからはみ出さないよう切る */
function clip(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : text;
}

/**
 * プレビュー画像を作る。
 * eyebrow = 上の小さな金の文字、title = 大きな見出し(改行で行を分けられる。2行目は金色)、lines = その下の説明、chips = いちばん下に「・」で並べる言葉
 */
export async function ogImage({
  eyebrow,
  title,
  lines = [],
  chips = [],
}: {
  eyebrow: string;
  title: string;
  lines?: string[];
  chips?: string[];
}) {
  // 行ごとに分け、いちばん長い行に合わせて字の大きさを決める(1行に収まらない語の途中で折れないように)
  const heads = title.split("\n").map((t) => clip(t, 18));
  const longest = Math.max(...heads.map((h) => [...h].length));
  const big = longest > 13 ? 56 : longest > 10 ? 62 : 72;
  const bold = ["Date", ...heads].join("");
  const regular = ["SENDAI", "仙台限定", eyebrow, ...lines, ...chips, "◆"].join("");
  const [fontBold, fontRegular] = await Promise.all([loadFont(bold, 700), loadFont(regular, 400)]);
  const fonts = [
    ...(fontBold ? [{ name: "NotoJP", data: fontBold, weight: 700 as const, style: "normal" as const }] : []),
    ...(fontRegular ? [{ name: "NotoJP", data: fontRegular, weight: 400 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "radial-gradient(ellipse 70% 90% at 88% 0%, #2a1f0c 0%, #0b0a09 62%)",
          color: INK,
          fontFamily: "NotoJP",
        }}
      >
        {/* 大きな三日月(伊達の前立て)。右上から少しはみ出させる */}
        <svg
          width="440"
          height="220"
          viewBox="0 0 240 120"
          style={{ position: "absolute", right: 96, top: 80, opacity: 0.95 }}
        >
          <defs>
            <linearGradient id="moon" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#8a6420" />
              <stop offset="0.55" stopColor={GOLD} />
              <stop offset="1" stopColor="#ffe3a3" />
            </linearGradient>
          </defs>
          <path d={CRESCENT_PATH} fill="url(#moon)" />
        </svg>

        {/* 細い金の二重の枠 */}
        <div style={{ position: "absolute", top: 26, left: 26, right: 26, bottom: 26, border: `1px solid ${HAIR}`, display: "flex" }} />
        <div style={{ position: "absolute", top: 34, left: 34, right: 34, bottom: 34, border: "1px solid rgba(245,184,61,0.12)", display: "flex" }} />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "68px 84px 64px",
          }}
        >
          {/* 上: 名前 */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
            <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: 2, color: INK }}>Date</span>
            <span style={{ fontSize: 20, fontWeight: 400, letterSpacing: 8, color: GOLD_SOFT }}>SENDAI</span>
          </div>

          {/* 中: 見出しと説明 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
              <div style={{ width: 48, height: 1, background: GOLD, display: "flex" }} />
              <span style={{ fontSize: 22, fontWeight: 400, letterSpacing: 6, color: GOLD }}>{eyebrow}</span>
            </div>
            {heads.map((h, i) => (
              <span
                key={i}
                style={{ fontSize: big, fontWeight: 700, lineHeight: 1.25, letterSpacing: 3, color: i > 0 ? GOLD : INK }}
              >
                {h}
              </span>
            ))}
            {lines.map((l, i) => (
              <span key={l} style={{ fontSize: 24, fontWeight: 400, letterSpacing: 2, color: i === 0 ? "#cfc8bd" : MUTED, marginTop: i === 0 ? 22 : 6 }}>
                {l}
              </span>
            ))}
          </div>

          {/* 下: 言葉を◆で区切って並べ、右に「仙台限定」 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {chips.map((c, i) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  {i > 0 && <span style={{ fontSize: 10, color: GOLD_SOFT }}>◆</span>}
                  <span style={{ fontSize: 24, fontWeight: 400, letterSpacing: 4, color: INK }}>{c}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 20, fontWeight: 400, letterSpacing: 6, color: MUTED }}>仙台限定</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, ...(fonts.length > 0 ? { fonts } : {}) },
  );
}
