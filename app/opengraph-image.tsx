import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Date 飲み会を、URLを貼るだけで決める";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return ogImage({
    eyebrow: "仙台生まれの飲み会セッティング",
    title: "URLを貼るだけで\n飲み会が決まる",
    lines: ["みんなが30秒で答えると、この4つが決まります"],
    chips: ["日にち", "時間", "予算", "お店"],
  });
}
