import "server-only";
import { ImageResponse } from "next/og";

// LINE などに貼ったときのプレビュー画像(1200×630)。Date の黒い地に金の三日月をそろえて使う。
// 日本語の字は、使う文字だけの Noto Sans JP を Google Fonts から読み込む(読み込めなくても画像は出す)

export const OG_SIZE = { width: 1200, height: 630 };

const GOLD = "#f5b83d";
const INK = "#f4f1ec";
const MUTED = "#a39c92";

async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@800&text=${encodeURIComponent(text)}`, {
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
 * eyebrow = 上の小さな金の文字、title = 大きな見出し(改行で行を分けられる。2行目は金色)、lines = その下の説明、chips = いちばん下に並べる枠
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
  const big = longest > 11 ? 76 : 96;
  const text = ["Date", "仙台限定", eyebrow, ...heads, ...lines, ...chips].join("");
  const font = await loadFont(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(circle at 85% 15%, #3b2a0c 0%, #0b0a09 55%)",
          color: INK,
          fontFamily: "NotoJP",
        }}
      >
        {/* 上: ロゴと「仙台限定」 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="72" height="72" viewBox="0 0 64 64">
              <rect x="1" y="1" width="62" height="62" rx="16" fill="#171513" stroke="#6b5323" strokeWidth="2" />
              <path d="M9 27C20 52 45 52 56 14C45 44 22 46 9 27Z" fill={GOLD} />
            </svg>
            <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>Date</span>
          </div>
          <span
            style={{
              fontSize: 26,
              color: MUTED,
              border: `2px solid #3a342d`,
              borderRadius: 999,
              padding: "8px 22px",
            }}
          >
            仙台限定
          </span>
        </div>

        {/* 中: 見出しと説明 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 30, color: GOLD, fontWeight: 800 }}>{eyebrow}</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {heads.map((h, i) => (
              <span key={i} style={{ fontSize: big, fontWeight: 800, lineHeight: 1.15, letterSpacing: -2, color: i > 0 ? GOLD : INK }}>
                {h}
              </span>
            ))}
          </div>
          {lines.map((l) => (
            <span key={l} style={{ fontSize: 32, color: "#d8d1c6" }}>
              {l}
            </span>
          ))}
        </div>

        {/* 下: 金の線と枠 */}
        <div style={{ display: "flex", gap: 14 }}>
          {chips.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: GOLD,
                background: "#221e1a",
                border: "2px solid #4a3c22",
                borderRadius: 18,
                padding: "10px 24px",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      ...(font ? { fonts: [{ name: "NotoJP", data: font, weight: 800 as const, style: "normal" as const }] } : {}),
    },
  );
}
