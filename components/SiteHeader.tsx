import { House } from "lucide-react";
import Link from "next/link";
import { BackButton } from "./BackButton";
import { Wordmark } from "./Logo";

// 上のバー。もとにした KANJI と同じく、名前を真ん中に置き、左に戻る・右にホーム。
export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto max-w-xl px-4 pt-2 pb-2">
        <div className="grid h-11 grid-cols-[2.75rem_1fr_2.75rem] items-center">
          <BackButton />
          <Link href="/" className="justify-self-center" aria-label="Date のトップ">
            <Wordmark size={24} />
          </Link>
          <Link
            href="/"
            aria-label="ホーム"
            className="-mr-2 grid size-11 place-items-center justify-self-end rounded-xl text-stone-400 transition hover:text-white active:scale-95"
          >
            <House className="size-5" aria-hidden />
          </Link>
        </div>
        {children}
      </div>
    </header>
  );
}
