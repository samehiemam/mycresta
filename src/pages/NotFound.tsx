import Link from "next/link";
import { SiteFooter } from "../../app/components/SiteFooter";
import { SiteHeader } from "../../app/components/SiteHeader";
import { useTitle } from "../lib/useTitle";

export default function NotFound() {
  useTitle("Page not found | Cresta Marine");
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-intro page-intro--wide">
          <span className="eyebrow">404</span>
          <h1>This page has drifted off course.</h1>
          <p>
            The page you were looking for isn&apos;t here. Head back to explore
            the fleet or configure your boat.
          </p>
          <div className="button-row">
            <Link className="button button--primary" href="/fleet">
              Explore the fleet
            </Link>
            <Link className="button button--outline button--configure" href="/configure">
              Configure your boat
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
