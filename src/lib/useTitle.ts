import { useEffect } from "react";

// Per-route <title> for client-side navigation.
//
// The initial title, description, canonical and Open Graph tags are baked into
// each route's HTML at build time by build/seo.ts, so a crawler or a social
// scraper sees the right ones without running any JavaScript. This only keeps
// the tab name correct as the user moves between routes afterwards — which
// means the string here must match the title in the route table, or the tab
// would change a moment after the page settles.
export function useTitle(title: string) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
