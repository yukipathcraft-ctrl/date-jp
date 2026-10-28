import { ChevronDown } from "lucide-react";

// たたんでおく枠。会が決まったあとの、もう見なくてよいもの(招待の URL・みんなの答えなど)をしまっておく。
// 押すと開く。開いているかは矢印の向きでも分かるようにする

export function Fold({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <details className="group mx-4 mt-4 rounded-3xl border panel">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block font-black">{title}</span>
          {note && <span className="block text-xs text-muted">{note}</span>}
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      {/* 中身は、もともと枠つきで作ってあるものをそのまま入れる */}
      <div className="pb-4 [&>section]:mt-0 [&>section]:border-0 [&>section]:bg-transparent [&>section]:shadow-none">{children}</div>
    </details>
  );
}
