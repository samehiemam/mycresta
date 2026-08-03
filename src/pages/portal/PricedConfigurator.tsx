import { Navigate } from "react-router-dom";

/**
 * The portal configurator, retired.
 *
 * There were two routes rendering the same component, differing only in a
 * `prices` prop each caller set for itself. That is no longer how prices work:
 * the figures are not in the bundle, and whether a session receives them is
 * decided by the server on every request. A second route cannot grant what the
 * server withholds, so it had nothing left to do — /configure now shows prices
 * to whoever is entitled to them and hides them from everyone else.
 *
 * Kept as a redirect rather than deleted: the path is bookmarked and linked
 * from the portal navigation.
 */
export function PricedConfigurator() {
  return <Navigate to="/configure" replace />;
}
