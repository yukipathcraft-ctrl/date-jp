import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-accent text-sm text-accent-text">
            乾
          </span>
          Nomise
        </Link>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-muted">仙台限定</span>
      </div>
    </header>
  );
}
