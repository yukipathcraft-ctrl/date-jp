import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "./Logo";

// 「次はあなたが幹事」。答えた人や傾斜会計を見た人に、自分でも会を作ってもらう入口
export function NextHost() {
  return (
    <section className="rounded-3xl border lux px-5 py-5">
      <div className="flex items-center gap-4">
        <LogoMark size={48} />
        <p className="min-w-0 flex-1">
          <span className="block font-extrabold">次の飲み会は、あなたが幹事になってみませんか</span>
          <span className="mt-0.5 block text-xs text-muted">URLをLINEに貼るだけで、日にちもお店も決まります</span>
        </p>
      </div>
      <Link
        href="/"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-accent/60 font-bold text-accent transition-colors hover:bg-accent hover:text-accent-text"
      >
        自分でも会をつくる
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
