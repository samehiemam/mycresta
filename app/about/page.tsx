import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "About Cresta Marine | Peak Boating Experience",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-intro page-intro--wide">
          <span className="eyebrow">Born from a love of boating</span>
          <h1>We live for the sea—and everything it makes possible.</h1>
          <p>
            Cresta Marine brings together people who love being on the water:
            island hopping at sunrise, sharing long lunches at anchor, finding
            quiet coves and sleeping aboard under the stars. We turn that
            passion into thoughtful yacht buying, reliable ownership support
            and genuine Peak Boating Experiences.
          </p>
        </section>
        <section className="about-image">
          <img
            src="/images/hero-home-k43-side-Dk6eFIXz.jpg"
            alt="Kumbra 43 on the water"
          />
        </section>
        <section className="about-story">
          <div>
            <span className="eyebrow">The boat is only the beginning</span>
            <h2>Adventure, nature and the people you share them with.</h2>
          </div>
          <div>
            <p>
              The best days at sea are not defined by specifications alone.
              They are the island-hopping routes, spontaneous swims, social
              moments, encounters with nature and the special charm of an
              overnight stay on board.
            </p>
            <p>
              We also believe confident boating comes from knowledge. Cresta
              shares practical guidance, ownership education and hands-on
              experience so clients understand their boats and enjoy the sea
              with greater confidence.
            </p>
          </div>
        </section>
        <section className="values-grid">
          <article>
            <span>01</span>
            <h2>Explore freely</h2>
            <p>
              From nearby islands to longer coastal adventures, we help shape
              boats and plans around how you truly want to use the sea.
            </p>
          </article>
          <article>
            <span>02</span>
            <h2>Share the experience</h2>
            <p>
              Boating brings people together. We create effortless settings
              for family, friends, community and memorable days on the water.
            </p>
          </article>
          <article>
            <span>03</span>
            <h2>Know your boat</h2>
            <p>
              Clear advice, practical education and responsive support help
              owners make better decisions before and after delivery.
            </p>
          </article>
        </section>
        <section className="connected-experience">
          <div>
            <span className="eyebrow eyebrow--light">
              Connected boating · Coming Soon
            </span>
            <h2>One Cresta experience, wherever boating takes you.</h2>
          </div>
          <div className="connected-experience-copy">
            <p>
              My Cresta will connect our website and mobile app through one
              secure account and one shared customer record. Explore every
              boat, review specifications, configure your preferred model and
              continue the same journey from any device.
            </p>
            <p>
              Potential customers, clients, owners, ambassadors and Cresta
              Marine employees will each see the tools and information relevant
              to them—creating a more personal, responsive and connected
              boating experience.
            </p>
            <Link className="button button--light" href="/my-cresta">
              My Cresta
            </Link>
          </div>
        </section>
        <section className="model-cta">
          <div>
            <span className="eyebrow">Peak Boating Experience, delivered</span>
            <h2>From choosing the right boat to every service after delivery.</h2>
            <p>
              Selection, configuration, purchase, delivery, servicing and
              concierge support—all centred on more rewarding time at sea.
            </p>
          </div>
          <Link
            className="button button--primary button--configure"
            href="/configure"
          >
            Configure your boat
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
