import Link from "next/link";
import { SiteFooter } from "../../app/components/SiteFooter";
import { SiteHeader } from "../../app/components/SiteHeader";
import { boats } from "../../app/data";
import { useTitle } from "../lib/useTitle";
import { useScrollOffset } from "../lib/motion";

const homeFleetImages: Record<string, string> = {
  "kumbra-34": "/images/home/kumbra-34-featured.jpg",
  "kumbra-36": "/images/home/kumbra-36-featured.jpg",
  "kumbra-43": "/images/home/kumbra-43-featured.jpg",
};

export default function Home() {
  useTitle("Cresta Marine | Beyond the Day Trip");
  const scrollY = useScrollOffset();
  // Hero copy lags the page slightly for depth, then fades before it can reach
  // the hero footer strip.
  const heroParallax = Math.min(scrollY, 520) * 0.08;
  const heroFade = Math.max(0, 1 - scrollY / 520);

  return (
    <>
      <div className="home-header">
        <SiteHeader inverse />
      </div>
      <main>
        <section className="home-hero">
          {/* The hero is the largest thing on the page and the one the browser
              waits on, so it is decoded eagerly and given its ratio up front
              to keep the copy below from jumping. */}
          <img
            src="/images/hero-home-k43-sunset.webp"
            alt="Kumbra 43 underway at sunset"
            width={1536}
            height={1024}
            fetchPriority="high"
            decoding="async"
          />
          <div className="home-hero-overlay" />
          <div
            className="home-hero-copy cresta-parallax"
            style={{
              transform: `translate3d(0, ${heroParallax}px, 0)`,
              opacity: heroFade,
            }}
          >
            {/* The proposition now leads, in both tiers: the kicker names what
                is different about these boats and the headline shows it. The
                brand line still sits in the page title, the footer and the
                share card, so nothing is lost by giving the hero to the idea
                that actually sells. */}
            <span className="eyebrow eyebrow--light">
              Beyond the day trip
            </span>
            {/* Broken by hand: left to wrap, "sunset." drops alone onto the
                second line at most desktop widths. */}
            <h1>
              The best days
              <br />
              do not end at sunset.
            </h1>
            <p>
              Island-hop across the Red Sea at first light, anchor somewhere
              quiet, and stay the night on board. Cresta Marine is the Kumbra
              Yachts dealer at Abu Tig Marina, El Gouna — Spanish-built yachts,
              configured around how you actually use the water.
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
          {/* Three items, not four: .hero-foot is a fixed three-column grid,
              and a fourth drops to a second row on its own. */}
          <div className="hero-foot">
            <span>El Gouna, Egypt</span>
            <span>Red Sea & North Coast</span>
            <span>Ownership, management & financing</span>
          </div>
        </section>

        <section className="home-thesis" data-reveal>
          {/* The eyebrow is uppercased in CSS, so it is written in sentence
              case like the others. */}
          <span className="eyebrow">A shared love of the sea</span>
          {/* Left to wrap it breaks after "on", splitting the phrase and
              leaving "the water." short. Broken at the clause instead. */}
          <h2>
            Advice shaped by
            <br />
            life on the water.
          </h2>
          <p>
            Choosing a yacht begins with understanding how you want to
            experience the sea. Through thoughtful guidance and a genuine
            passion for life on the water, we help you find the Kumbra yacht
            that feels right for you—from the first conversation to every
            journey ahead.
          </p>
        </section>

        <section className="home-fleet">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow">Featured fleet · Kumbra Yachts</span>
              <h2>Distinctive by design. Selected to meet the Cresta standard.</h2>
            </div>
            <Link href="/fleet">View all models →</Link>
          </div>
          <div className="boat-card-grid" data-reveal data-reveal-stagger>
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
          <div className="studio-copy" data-reveal>
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
              <li>Yacht financing for eligible clients</li>
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
          <div className="platform-copy" data-reveal>
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
          <div className="home-app-showcase" data-reveal>
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
          <div className="role-stack" data-reveal data-reveal-stagger>
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

        <section className="home-contact" data-reveal>
          <span className="eyebrow">Start with a conversation</span>
          <h2>Your next chapter starts with the right boat.</h2>
          <p>
            Tell us how you want to use the sea. We will help you choose,
            configure and own the boat that fits — with{" "}
            <Link className="inline-link" href="/yacht-finance">yacht financing</Link> available to
            eligible clients through our partner Contact Finance.
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
