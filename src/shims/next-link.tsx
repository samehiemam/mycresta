import { Link as RouterLink } from "react-router-dom";
import type { AnchorHTMLAttributes, ReactNode } from "react";

// Drop-in replacement for `next/link`. Internal paths route through
// react-router; external / protocol / same-page-hash links render a plain <a>.
type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
  // Accept (and ignore) Next-only props so existing JSX compiles unchanged.
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

function isExternal(href: string) {
  return (
    /^(https?:|mailto:|tel:|sms:)/.test(href) ||
    href.startsWith("#") ||
    href.startsWith("//")
  );
}

export default function Link({
  href,
  children,
  prefetch: _prefetch,
  replace,
  scroll: _scroll,
  ...rest
}: LinkProps) {
  if (!href || isExternal(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={href} replace={replace} {...rest}>
      {children}
    </RouterLink>
  );
}
