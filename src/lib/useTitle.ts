import { useEffect } from "react";

// Per-route <title>. (Full per-page OG/meta would require prerendering; the
// site-wide tags in index.html cover social scrapers for now.)
export function useTitle(title: string) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
