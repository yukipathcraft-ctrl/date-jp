import { OG_SIZE, ogImage } from "@/lib/og";

// 集金の URL を LINE に貼ったときのカードの画像。アイコンだけにする

export const alt = "Date の集金";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage();
}
