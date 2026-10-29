// お店のページへのリンクが、紹介料の付くリンク(ホットペッパーのアフィリエイト)になっていることを書く。
// 広告だと分かるように書く決まり(ステルスマーケティングの規制)があるので、リンクの近くに必ず置く。
// AFFILIATE_ON は next.config.ts で、AFFILIATE_URL_TEMPLATE が入っているときだけ "1" になる

export function PrNote({ className = "" }: { className?: string }) {
  if (process.env.AFFILIATE_ON !== "1") return null;
  return (
    <p className={`flex items-start gap-1.5 text-xs text-muted ${className}`}>
      <span className="shrink-0 rounded border border-white/20 px-1 py-px text-[10px] leading-4 text-white/50">PR</span>
      お店のページから予約すると、Date に紹介料が入ることがあります。お店の料金は変わりません
    </p>
  );
}
