import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";

/**
 * Navigation between the signed-in pages.
 *
 * Every portal page rendered its own header and footer and offered no way at
 * all to reach another one — Users, Leads and the rest could only be opened by
 * typing the URL. This is the missing piece, kept as a bar the pages drop in
 * rather than a shell they are rebuilt inside: the pages differ too much in
 * structure (Builds and the Studio each render several layouts of their own)
 * for a wholesale rewrite to be worth the risk of mangling them.
 *
 * One list, in one file. A page added later is a line here rather than a link
 * to remember in six components.
 */

type Role = "admin" | "employee" | "ambassador" | "customer";

type NavItem = {
  to: string;
  label: string;
  /** Who sees it. Absent means everyone signed in. */
  roles?: Role[];
  /** Also lit on nested paths — /portal/builds/:id keeps Configurations lit. */
  nested?: boolean;
};

/**
 * Ordered by how often it is used rather than by module: whoever signs in
 * spends their day in the pipeline and the configurator, not in approvals.
 */
const NAV: NavItem[] = [
  { to: "/portal", label: "Overview" },
  { to: "/portal/leads", label: "Pipeline", roles: ["admin", "employee", "ambassador"] },
  { to: "/configure", label: "Configurator" },
  { to: "/portal/builds", label: "Configurations", nested: true },
  { to: "/portal/studio", label: "Catalog", roles: ["admin", "employee", "ambassador"], nested: true },
  { to: "/portal/users", label: "People", roles: ["admin"] },
  { to: "/portal/users?role=ambassador", label: "Ambassadors", roles: ["admin", "employee"] },
  { to: "/portal/accounts", label: "Approvals", roles: ["admin", "employee"] },
];

export function PortalNav() {
  const { user } = useAuth();
  const location = useLocation();

  // Read the query from the router, not window.location: the latter does not
  // re-render when only the query string changes, so the lit item would stick.
  const onAmbassadors =
    new URLSearchParams(location.search).get("role") === "ambassador";

  const items = NAV.filter(
    (item) => !item.roles || item.roles.includes(user?.role as Role),
  );

  return (
    <nav className="portal-nav" aria-label="My Cresta">
      {items.map((item) => (
        <NavLink
          key={item.to + item.label}
          to={item.to}
          end={!item.nested}
          className={({ isActive }) => {
            // People and Ambassadors share a path and differ only by query,
            // which react-router's isActive cannot see — so exactly one of the
            // pair is decided here instead.
            const filtered = item.to.includes("?");
            const lit = filtered ? onAmbassadors : isActive && !onAmbassadors;
            return lit ? "is-active" : "";
          }}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
