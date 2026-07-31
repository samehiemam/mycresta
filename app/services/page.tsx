import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Ownership & yacht care | Cresta Marine",
};

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-intro">
          <span className="eyebrow">Ownership, organised</span>
          <h1>More time on the water. Less marina administration.</h1>
          <p>
            Full ownership or a managed share, supported by Cresta Marine and
            connected through My Cresta.
          </p>
        </section>
        <section className="service-grid">
          <article className="service-feature">
            <span className="eyebrow eyebrow--light">Full ownership</span>
            <h2>Your boat. One Cresta standard.</h2>
            <p>
              Cresta Marine coordinates selection, personalisation, delivery,
              commissioning and ongoing yacht care—with one accountable team
              throughout the ownership journey.
            </p>
            <ul className="service-feature-points">
              <li>Independent guidance and personal configuration</li>
              <li>Delivery, commissioning and ownership documentation</li>
              <li>Service planning, yacht care and trip preparation</li>
              <li>Secure records and requests through My Cresta</li>
            </ul>
            <Link
              className="button button--light button--configure"
              href="/configure"
            >
              Configure your boat
            </Link>
          </article>
          <article>
            <span className="eyebrow">Co-ownership</span>
            <h2>Own the time you use.</h2>
            <p>
              Transparent scheduling, shared expenses and Cresta-managed care,
              all visible through My Cresta.
            </p>
          </article>
          <article>
            <span className="eyebrow">Yacht care</span>
            <h2>Ready before you arrive.</h2>
            <p>
              Request cleaning, fueling, service, trip preparation and
              provisioning without a chain of calls.
            </p>
          </article>
        </section>
        <section className="financing-section">
          <div className="financing-copy">
            <span className="eyebrow">Financing options</span>
            <h2>A clearer path to owning your boat.</h2>
            <p>
              Cresta Marine can introduce eligible clients to financing options
              through Contact Finance, helping structure the purchase around
              personal plans while keeping the yacht selection and ownership
              journey coordinated through one team.
            </p>
            <a
              className="button button--primary"
              href="mailto:info@crestamarine.com?subject=Boat%20financing%20enquiry"
            >
              Discuss financing
            </a>
          </div>
          <div className="financing-partner">
            <span>Financing partner</span>
            <img
              src="/images/partners/contact-finance.avif"
              alt="Contact Finance"
            />
            <p>
              Financing is subject to eligibility, credit approval and the
              partner&apos;s applicable terms and conditions.
            </p>
          </div>
        </section>
        <section className="portal-preview-strip">
          <div>
            <span className="eyebrow eyebrow--light">The Cresta platform</span>
            <h2>One account follows the full ownership journey.</h2>
          </div>
          <Link className="button button--light" href="/my-cresta">
            My Cresta
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
