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
 * The figures below are Contact Finance's own published terms for their
 * watercraft product, not Cresta's. They are stated as the partner's, dated
 * to when they were taken, and linked to the source, because a lender's terms
 * change without telling us and a stale number about credit misleads a buyer.
 * Nothing here is inferred: the rate is absent from this page because Contact
 * does not publish one, and inventing a plausible figure would be worse than
 * the gap it fills.
 */

/** Terms as published by Contact Finance. Six items: .boat-specs is a 6/3/2
 *  column grid, so any other count leaves a ragged row at some breakpoint. */
const PARTNER_TERMS: Array<[string, string]> = [
  ["Financing up to", "15,000,000 EGP"],
  ["Down payment from", "20%"],
  ["Payment plan up to", "5 years"],
  ["Applicant age", "21–65"],
  ["Currency", "Egyptian pounds"],
  ["Required", "Valid Egyptian ID"],
];

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
            Egypt through our partner Contact — so the boat, the paperwork and
            the funding are handled by one coordinated team.
          </p>
        </section>

        <section
          className="boat-specs"
          aria-label="Contact watercraft financing terms"
          data-reveal
          data-reveal-stagger
        >
          {PARTNER_TERMS.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="service-grid" data-reveal data-reveal-stagger>
          <article className="service-feature">
            <span className="eyebrow eyebrow--light">How it works</span>
            <h2>From configuration to approval.</h2>
            <p>
              Choose your Kumbra, configure it the way you intend to use it,
              and we prepare a personal quotation. From there we introduce you
              to Contact, who assess eligibility and credit and set the terms of
              any offer. Applications can be completed online, by phone or at a
              Contact branch.
            </p>
            <ul className="service-feature-points">
              <li>Configure your boat and receive a personal quotation</li>
              <li>Introduction to Contact for eligible clients</li>
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
            <span className="eyebrow">Who can apply</span>
            <h2>Egyptian ID holders, 21 to 65.</h2>
            <p>
              Contact&apos;s watercraft financing is offered in Egyptian pounds
              to applicants holding a valid Egyptian ID, aged between 21 and 65.
              Further documents may be requested once an application is
              reviewed.
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
              Contact finances watercraft up to 15 million EGP, with down
              payments from 20% and plans of up to five years. The rate and the
              structure that apply to you depend on your circumstances and are
              set by Contact — tell us which Kumbra you have in mind and we will
              arrange the introduction.
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
            {/* width/height are the asset's own dimensions: a wrong ratio
                reserves the wrong space and shifts the layout on load. */}
            <img
              src="/images/partners/contact-finance.avif"
              alt="Contact — Cresta Marine's yacht financing partner in Egypt"
              width="300"
              height="150"
            />
            <p>
              Terms shown are published by{" "}
              <a
                className="text-link"
                href="https://contact.eg/en/products/watercraft"
                target="_blank"
                rel="noreferrer"
              >
                Contact
              </a>{" "}
              and were correct in August 2026. Financing is subject to
              eligibility, credit approval and the partner&apos;s applicable
              terms and conditions, all of which may change. Cresta Marine
              introduces clients to Contact and is not a lender.
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
