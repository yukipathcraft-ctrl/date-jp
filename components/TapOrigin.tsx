"use client";

import { useEffect } from "react";

// 最後に押した場所を CSS の変数(--tap-x, --tap-y)に入れておく。
// 画面の切り替わりで、新しい画面をそこから丸く広げるのに使う(globals.css の vt-reveal)
export function TapOrigin() {
  useEffect(() => {
    const root = document.documentElement;
    const onDown = (e: PointerEvent) => {
      root.style.setProperty("--tap-x", `${Math.round(e.clientX)}px`);
      root.style.setProperty("--tap-y", `${Math.round(e.clientY)}px`);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
