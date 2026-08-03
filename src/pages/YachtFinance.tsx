import Link from "next/link";
import { SiteFooter } from "../../app/components/SiteFooter";
import { SiteHeader } from "../../app/components/SiteHeader";
import { useTitle } from "../lib/useTitle";

/**
 * Yacht financing.
 *
 * Split out of /services, where it was three sentences inside a 227-word page
 * whose title mentioned only ownership and yacht care. Financing is a real,
 * differentiated offer and the queries around it ("boat finance Egypt",
 * "yacht financing Egypt") are commercially valuable and barely contested —
 * but nothing could rank for them while the content had no page, no URL and
 * no title of its own.
 *
 * Everything here is drawn from what Cresta already publishes: introductions
 * for eligible clients through Contact Finance, subject to credit approval.
 * No rate, term, deposit or eligibility rule is stated anywhere on this page,
 * because none has been confirmed — and a wrong number about credit is worse
 * than no number at all. Where a client would reasonably expect a figure, the
 * page says plainly that Contact Finance sets it.
 */
export default function YachtFinance() {
  useTitle("Yacht financing in Egypt | Cresta Marine");

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-intro" data-reveal>
          <span className="eyebrow">Yacht financing</span>
          <h1>A clearer path to owning your boat.</h1>
          <p>
            Cresta Marine can introduce eligible clients to yacht financing in
            Egypt through our partner Contact Finance — so the boat, the
            paperwork and the funding are handled by one coordinated team.
          </p>
        </section>

        <section className="service-grid" data-reveal data-reveal-stagger>
          <article className="service-feature">
            <span className="eyebrow eyebrow--light">How it works</span>
            <h2>From configuration to approval.</h2>
            <p>
              Choose your Kumbra, configure it the way you intend to use it,
              and we prepare a personal quotation. From there we introduce you
              to Contact Finance, who assess eligibility and credit and set the
              terms of any offer.
            </p>
            <ul className="service-feature-points">
              <li>Configure your boat and receive a personal quotation</li>
              <li>Introduction to Contact Finance for eligible clients</li>
              <li>Eligibility, credit assessment and terms set by the partner</li>
              <li>Selection, delivery and ownership stay with one Cresta team</li>
            </ul>
            <Link
              className="button button--light button--configure"
              href="/configure"
            >
              Configure your boat
            </Link>
          </article>
          <article>
            <span className="eyebrow">What can be financed</span>
            <h2>The boat you actually configured.</h2>
            <p>
              Financing is arranged against the yacht and the specification you
              select, not a stock boat chosen for you. Contact Finance confirms
              the amount and structure available to you.
            </p>
          </article>
          <article>
            <span className="eyebrow">Where we deliver</span>
            <h2>Red Sea and North Coast.</h2>
            <p>
              Cresta Marine is based at Abu Tig Marina in El Gouna and supports
              owners across the Red Sea and Egypt&apos;s North Coast, from
              handover through servicing and yacht care.
            </p>
          </article>
        </section>

        <section className="financing-section" data-reveal>
          <div className="financing-copy">
            <span className="eyebrow">Financing partner</span>
            <h2>Talk to us about the numbers.</h2>
            <p>
              Deposit, term and rate depend on your circumstances and are set by
              Contact Finance rather than quoted here. Tell us which Kumbra you
              have in mind and we will arrange the introduction.
            </p>
            <a
              className="button button--primary"
              href="mailto:info@crestamarine.com?subject=Yacht%20financing%20enquiry"
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
              partner&apos;s applicable terms and conditions. Cresta Marine
              introduces clients to Contact Finance and is not a lender.
            </p>
          </div>
        </section>

        <section className="portal-preview-strip" data-reveal>
          <div>
            <span className="eyebrow eyebrow--light">The Cresta platform</span>
            <h2>Your quotation and documents, in one account.</h2>
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
