// お店のページへのリンクが、紹介料の付くリンク(ホットペッパーのアフィリエイト)になっていることを書く。
// 広告だと分かるように書く決まり(ステルスマーケティングの規制)があるので、リンクの近くに必ず置く。
// AFFILIATE_ON は next.config.ts で、AFFILIATE_URL_TEMPLATE が入っているときだけ "1" になる

export function PrNote({ className = "" }: { className?: string }) {
  if (process.env.AFFILIATE_ON !== "1") return null;
  return (
    <p className={`flex items-center gap-1.5 text-[11px] text-white/40 ${className}`}>
      <span className="shrink-0 rounded border border-white/20 px-1 text-[10px] leading-4">PR</span>
      予約のリンクは提携リンクです
    </p>
  );
}
