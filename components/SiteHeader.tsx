import Link from "next/link";
import { BackButton } from "./BackButton";
import { LogoMark } from "./Logo";

// 画面が切り替わっても上のバーは動かさない(globals.css の site-header)
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur" style={{ viewTransitionName: "site-header" }}>
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <div className="flex items-center">
          <BackButton />
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <LogoMark size={28} />
            Date
          </Link>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted">仙台限定</span>
      </div>
    </header>
  );
}
