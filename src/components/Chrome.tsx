import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";

/** Thin teal reading-progress line pinned to the top of the viewport. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    function update() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        frame = 0;
      });
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="cresta-progress"
      style={{ transform: `scaleX(${progress})` }}
      aria-hidden="true"
    />
  );
}

/**
 * Brief branded curtain on first load only. Skipped entirely for repeat
 * navigations in the same tab and when reduced motion is requested.
 */
export function IntroCurtain() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    if (prefersReducedMotion()) return false;
    return sessionStorage.getItem("cresta-intro-shown") !== "1";
  });

  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem("cresta-intro-shown", "1");
    const timer = window.setTimeout(() => setShow(false), 1900);
    return () => window.clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="cresta-intro" aria-hidden="true">
      <img src="/images/cresta-logo-white.png" alt="" />
    </div>
  );
}
