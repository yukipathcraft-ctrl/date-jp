import { ViewTransition } from "react";

// 画面の切り替わり。奥へ進むときは右から、戻るときは左から入れ、方向が分からないとき(ブラウザの戻るなど)は
// 下から静かに浮かせる。上のバーは名前を付けて動かさない(globals.css の site-header)。
// 同じ画面の読み直し(router.refresh)では入れ替わりが起きないので動かない

export function PageMotion({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page-rise" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page-fade" }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}
