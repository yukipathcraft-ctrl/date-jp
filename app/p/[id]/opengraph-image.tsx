import { OG_SIZE, ogImage } from "@/lib/og";

// 会の URL を LINE に貼ったときのカードの画像。アイコンだけにして、会の名前や日時はカードの文字で伝える

export const alt = "Date の飲み会";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage();
}
