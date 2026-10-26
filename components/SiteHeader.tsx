import Link from "next/link";
import { BackButton } from "./BackButton";
import { LogoMark } from "./Logo";

// 画面が切り替わっても上のバーは動かさない(globals.css の site-header)
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-accent/10 bg-black/70 backdrop-blur-xl" style={{ viewTransitionName: "site-header" }}>
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <div className="flex items-center">
          <BackButton />
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-[0.18em]">
            <LogoMark size={28} />
            Date
          </Link>
        </div>
        <span className="rounded-full border border-accent/30 px-3 py-1 text-[11px] font-medium tracking-[0.2em] text-accent/85">仙台限定</span>
      </div>
    </header>
  );
}
