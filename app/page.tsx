import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { boats } from "./data";

export const metadata: Metadata = {
  title: "Cresta Marine | Peak Boating Experience",
  description:
    "Cresta Marine delivers the Peak Boating Experience through curated yachts, personal configuration, ownership support and yacht care.",
};

const homeFleetImages: Record<string, string> = {
  "kumbra-34": "/images/home/kumbra-34-featured.jpg",
  "kumbra-36": "/images/home/kumbra-36-featured.jpg",
  "kumbra-43": "/images/home/kumbra-43-featured.jpg",
};

export default function Home() {
  return (
    <>
      <div className="home-header">
        <SiteHeader inverse />
      </div>
      <main>
        <section className="home-hero">
          <img
            src="/images/hero-home-k43-side-Dk6eFIXz.jpg"
            alt="Kumbra 43 underway"
          />
          <div className="home-hero-overlay" />
          <div className="home-hero-copy">
            <span className="eyebrow eyebrow--light">
              Peak Boating Experience
            </span>
            <h1>
              Configure your boat.
              <br />
              Own the Sea.
            </h1>
            <p>
              Distinctive yachts, chosen without compromise and configured
              around the way you live on the water. One Cresta standard,
              wherever your course leads.
            </p>
            <div className="button-row">
              <Link
                className="button button--light button--configure"
                href="/configure"
              >
                Configure your boat
              </Link>
              <Link className="button button--ghost-light" href="/fleet">
                Explore the fleet
              </Link>
            </div>
          </div>
          <div className="hero-foot">
            <span>Based at Abu Tig Marina · Egypt</span>
            <span>Full & co-ownership</span>
            <span>Yacht care & concierge</span>
          </div>
        </section>

        <section className="home-thesis">
          <span className="eyebrow">Peak Boating Experience</span>
          <h2>
            The peak is not a place.
            <br />
            It is how boating should feel.
          </h2>
          <p>
            From selecting the right yacht to personalisation, delivery and
            long-term care, Cresta makes every step considered, connected and
            distinctly yours.
          </p>
        </section>

        <section className="home-fleet">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Featured fleet · Kumbra Yachts</span>
              <h2>Distinctive by design. Selected to meet the Cresta standard.</h2>
            </div>
            <Link href="/fleet">View all models →</Link>
          </div>
          <div className="boat-card-grid">
            {boats.map((boat) => (
              <article className="boat-card" key={boat.slug}>
                <Link href={`/fleet/${boat.slug}`}>
                  <div className="boat-card-image">
                    <img
                      className={`home-fleet-image home-fleet-image--${boat.slug}`}
                      src={homeFleetImages[boat.slug] ?? boat.hero}
                      alt={`${boat.name} on the water`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span>Explore</span>
                  </div>
                  <div className="boat-card-copy">
                    <div>
                      <span>{boat.eyebrow}</span>
                      <h3>{boat.name}</h3>
                    </div>
                    <dl>
                      <div>
                        <dt>LOA</dt>
                        <dd>{boat.length}</dd>
                      </div>
                      <div>
                        <dt>Capacity</dt>
                        <dd>{boat.capacity}</dd>
                      </div>
                      <div>
                        <dt>Power</dt>
                        <dd>{boat.power}</dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="studio-teaser">
          <div className="studio-copy">
            <span className="eyebrow">Cresta Studio</span>
            <h2>Your specification, before the quotation.</h2>
            <p>
              Select the model, hull, power, upholstery and equipment. Save the
              result to your account so a Cresta advisor can prepare the right
              quote.
            </p>
            <ul>
              <li>Curated yacht models</li>
              <li>Full or co-ownership</li>
              <li>Saved to your customer account</li>
            </ul>
            <Link
              className="button button--primary button--configure"
              href="/configure"
            >
              Configure your boat
            </Link>
          </div>
        </section>

        <section className="platform-section">
          <div className="platform-copy">
            <span className="eyebrow eyebrow--light">My Cresta</span>
            <h2>Your boating life. One connected experience.</h2>
            <p>
              From your first configuration to every day of ownership, My
              Cresta keeps your boat, documents, quotations and services
              together—with direct access to the Cresta Marine team.
            </p>
            <p className="platform-app-note">
              <strong>My Cresta App · Coming Soon</strong>
              The same Cresta account will connect the website and mobile app,
              with our complete fleet, boat specifications, configurator and
              role-based services for customers, owners, ambassadors and the
              Cresta Marine team.
            </p>
            <Link className="button button--light" href="/my-cresta">
              My Cresta
            </Link>
          </div>
          <div className="home-app-showcase">
            <div className="home-app-showcase-copy">
              <span className="eyebrow eyebrow--light">
                My Cresta App · Coming Soon
              </span>
              <h3>From finding your boat to preparing your next escape.</h3>
              <p>
                Discover the fleet, explore complete specifications, configure
                your boat and continue into ownership with live boat status,
                service requests, trip preparation and onboard provisioning.
                One account keeps the entire Cresta experience connected.
              </p>
              <Link className="role-stack-link" href="/my-cresta">
                Discover the My Cresta App →
              </Link>
            </div>
            <div className="home-app-phones">
              <img
                className="home-app-phone home-app-phone--catalog"
                src="/images/my-cresta-app/boat-detail.png"
                alt="My Cresta App boat specifications screen"
                loading="lazy"
              />
              <img
                className="home-app-phone home-app-phone--status"
                src="/images/my-cresta-app/boat-status.png"
                alt="My Cresta App boat status screen"
                loading="lazy"
              />
              <img
                className="home-app-phone home-app-phone--trip"
                src="/images/my-cresta-app/trip-preparation.png"
                alt="My Cresta App trip preparation screen"
                loading="lazy"
              />
            </div>
          </div>
          <div className="role-stack">
            <article>
              <span>Build your boat</span>
              <strong>
                Save configurations, compare options and receive a personalised
                quotation.
              </strong>
            </article>
            <article>
              <span>Cresta owners</span>
              <strong>
                Manage your boat, access documents, request services and
                enjoy dedicated concierge services.
              </strong>
            </article>
            <article>
              <span>Cresta ambassadors</span>
              <div>
                <strong>
                  Introduce qualified clients, follow your referrals and earn
                  commission on successful eligible sales.
                </strong>
                <Link className="role-stack-link" href="/my-cresta#team-access">
                  Apply to become an ambassador →
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="home-contact">
          <span className="eyebrow">Peak Boating Experience</span>
          <h2>Your next chapter starts with the right boat.</h2>
          <p>
            Tell us how you want to use the sea. We will help you choose,
            configure and own the boat that fits.
          </p>
          <div className="button-row">
            <Link
              className="button button--primary button--configure"
              href="/configure"
            >
              Configure your boat
            </Link>
            <a
              className="button button--outline"
              href="https://wa.me/201224212222"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Cresta
            </a>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
