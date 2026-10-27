// 画面の地。切り替わりの動き(ViewTransition)は待たされて煩わしいので付けない
export function PageMotion({ children }: { children: React.ReactNode }) {
  return <div className="page-bg min-h-dvh">{children}</div>;
}
