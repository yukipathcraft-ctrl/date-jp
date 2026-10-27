import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "./Logo";

// 「次はあなたが幹事」。答えた人や傾斜会計を見た人に、自分でも会を作ってもらう入口。
// occasion = その時期の次の会の呼び方(忘年会・新歓など。lib/invite.ts の nextOccasion)
export function NextHost({ occasion = "次の飲み会" }: { occasion?: string }) {
  return (
    <section className="band px-5 py-5">
      <div className="flex items-center gap-4">
        <LogoMark size={48} />
        <p className="min-w-0 flex-1">
          <span className="block font-black">{occasion}の幹事になったら、Dateで決めませんか</span>
          <span className="mt-0.5 block text-xs text-muted">URLを送るだけで、日にちもお店も3分で決まります。登録はいりません</span>
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
