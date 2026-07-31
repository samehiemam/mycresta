import {
  useSearchParams as useRouterSearchParams,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

// Minimal `next/navigation` surface backed by react-router. Only the pieces the
// reused client components rely on are implemented.

// next's useSearchParams() returns the URLSearchParams directly (with .get());
// react-router returns a [params, setParams] tuple — adapt to next's shape.
export function useSearchParams() {
  const [params] = useRouterSearchParams();
  return params;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {},
    prefetch: () => {},
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export { useParams };

export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}

export function redirect(href: string): never {
  if (typeof window !== "undefined") {
    window.location.assign(href);
  }
  throw new Error("NEXT_REDIRECT");
}
