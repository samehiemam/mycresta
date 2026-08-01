import { useEffect, useRef, useState } from "react";

// Shared motion utilities. Every effect degrades to "no animation" when the
// visitor prefers reduced motion, and to plain static content without JS.

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reveal-on-scroll. Adds `is-visible` to matching elements once they enter the
 * viewport. Runs against the whole subtree so pages don't need per-node refs.
 */
export function useRevealOnScroll(deps: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!nodes.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((node) => {
      // Anything already on screen at mount reveals immediately (no flash).
      if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
        node.classList.add("is-visible");
      } else {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Vertical scroll offset, throttled to animation frames. Used for parallax. */
export function useScrollOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setOffset(window.scrollY);
        frame = 0;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return offset;
}

/** True once the page has scrolled past `threshold` px. */
export function useScrolledPast(threshold = 24) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    function onScroll() {
      setPast(window.scrollY > threshold);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return past;
}

/**
 * Counts a numeric value up when the element scrolls into view, preserving the
 * original string's prefix/suffix (e.g. "13.35 m", "1,200 hp", "up to 40 kn").
 */
export function useCountUp(text: string, duration = 1100) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);
  const done = useRef(false);

  useEffect(() => {
    setDisplay(text);
    done.current = false;
  }, [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Grab the first number in the string; bail out if there isn't one.
    const match = text.match(/[\d][\d,.]*/);
    if (!match || prefersReducedMotion() || !("IntersectionObserver" in window)) {
      return;
    }

    const raw = match[0];
    const target = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(target)) return;

    const decimals = raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0;
    const grouped = raw.includes(",");
    const before = text.slice(0, match.index ?? 0);
    const after = text.slice((match.index ?? 0) + raw.length);

    const format = (value: number) => {
      const fixed = value.toFixed(decimals);
      if (!grouped) return fixed;
      const [int, dec] = fixed.split(".");
      const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return dec ? `${withCommas}.${dec}` : withCommas;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || done.current) return;
          done.current = true;
          observer.unobserve(entry.target);

          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            // easeOutExpo — fast start, gentle settle.
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setDisplay(`${before}${format(target * eased)}${after}`);
            if (progress < 1) requestAnimationFrame(tick);
            else setDisplay(text);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [text, duration]);

  return { ref, display };
}
