import type { Metadata } from "next";
import Link from "next/link";
import { AccessRequestForm } from "../components/AccessRequestForm";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "../chatgpt-auth";
import { getAccessUserByEmail, isAdminEmail } from "../../db/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Cresta | Cresta Marine",
  description:
    "Your Cresta Marine account for boat configurations, quotations, ownership services, documents and concierge support.",
};

export default async function MyCrestaPage() {
  const user = await getChatGPTUser();
  const accessUser = user ? await getAccessUserByEmail(user.email) : null;
  const canOpenAccount =
    !!user &&
    (isAdminEmail(user.email) || accessUser?.status === "approved");

  return (
    <>
      <SiteHeader inverse />
      <main className="my-cresta-page">
        <section className="my-cresta-hero">
          <div className="my-cresta-hero-copy">
            <span className="eyebrow eyebrow--light">My Cresta</span>
            <h1>Your boating life, beautifully organised.</h1>
            <p>
              Begin with a saved configuration. Continue with your quotation,
              ownership documents, boat care and concierge requests—all through
              one direct relationship with Cresta Marine.
            </p>
            <div className="my-cresta-hero-actions">
              <a className="button button--light" href="#account-access">
                My Cresta
              </a>
              <Link className="button button--ghost-light" href="/configure">
                Start a configuration
              </Link>
            </div>
          </div>
          <div className="my-cresta-hero-visual" aria-hidden="true">
            <img
              src="/images/k43-antracite-D4h5PNjW.png"
              alt=""
            />
            <div className="my-cresta-visual-note">
              <span>One account</span>
              <strong>From first idea to every day on the water.</strong>
            </div>
          </div>
        </section>

        <section className="my-cresta-benefits" aria-label="My Cresta benefits">
          <article>
            <span>01</span>
            <h2>Build & quote</h2>
            <p>
              Save configurations, compare equipment and receive a tailored
              quotation from your Cresta advisor.
            </p>
          </article>
          <article>
            <span>02</span>
            <h2>Manage your boat</h2>
            <p>
              Keep specifications, ownership documents, service history and
              important updates together.
            </p>
          </article>
          <article>
            <span>03</span>
            <h2>Request services</h2>
            <p>
              Ask for cleaning, fueling, maintenance, provisioning or trip
              preparation from one place.
            </p>
          </article>
          <article>
            <span>04</span>
            <h2>Cresta concierge</h2>
            <p>
              Plan time on the water with direct support from the people who
              know your boat.
            </p>
          </article>
        </section>

        <section className="my-cresta-access" id="account-access">
          <div className="my-cresta-access-heading">
            <span className="eyebrow">Your account</span>
            <h2>Come aboard.</h2>
            <p>
              Sign in to your existing account or register to save a
              configuration and begin a conversation with Cresta Marine.
            </p>
          </div>

          <div className="my-cresta-access-grid">
            <aside className="my-cresta-signin">
              <span className="eyebrow eyebrow--light">Existing account</span>
              {canOpenAccount ? (
                <>
                  <h2>Welcome back.</h2>
                  <p>
                    Signed in as <strong>{user.email}</strong>.
                  </p>
                  <Link
                    className="button button--light button--full"
                    href="/portal"
                  >
                    My Cresta
                  </Link>
                  <a
                    className="my-cresta-signout"
                    href={chatGPTSignOutPath("/my-cresta")}
                  >
                    Sign out
                  </a>
                </>
              ) : user ? (
                <>
                  <h2>Your request is being reviewed.</h2>
                  <p>
                    Signed in as <strong>{user.email}</strong>. Account status:{" "}
                    <strong>{accessUser?.status ?? "not registered"}</strong>.
                  </p>
                  <a
                    className="my-cresta-signout"
                    href={chatGPTSignOutPath("/my-cresta")}
                  >
                    Sign out
                  </a>
                </>
              ) : (
                <>
                  <h2>Secure account access.</h2>
                  <p>
                    Use your Google account on the secure sign-in screen, or
                    continue with your existing ChatGPT account.
                  </p>
                  <a
                    className="social-button social-button--google"
                    href={chatGPTSignInPath("/my-cresta")}
                  >
                    <span className="google-mark" aria-hidden="true">
                      G
                    </span>
                    Continue with Google
                  </a>
                  <a
                    className="button button--light button--full"
                    href={chatGPTSignInPath("/my-cresta")}
                  >
                    Continue securely
                  </a>
                  <small>
                    Google is available through Cresta&apos;s secure account
                    sign-in.
                  </small>
                </>
              )}
            </aside>

            <article className="my-cresta-registration">
              <span className="eyebrow">New to My Cresta</span>
              <h2>Create your customer profile.</h2>
              <p>
                Tell us a little about your boating plans. We will connect your
                profile to future configurations, quotations and ownership
                support.
              </p>
              <AccessRequestForm mode="customer" />
            </article>
          </div>
        </section>

        <section className="my-cresta-mobile-preview">
          <div>
            <span className="eyebrow eyebrow--light">
              My Cresta App · Coming Soon
            </span>
            <h2>The same Cresta experience, in your pocket.</h2>
            <p>
              The My Cresta App will use the same secure account and shared
              user database as the website. Browse every boat, review complete
              specifications, use the configurator and continue your journey
              without starting again.
            </p>
            <p>
              Potential customers, clients, owners, ambassadors and employees
              will each receive the right experience—from enquiries and saved
              builds to boat status, service requests, trip preparation and
              concierge support.
            </p>
            <ul className="app-feature-list">
              <li>
                <strong>Explore & configure</strong>
                <span>
                  Browse every Cresta boat, compare specifications and build
                  your preferred configuration.
                </span>
              </li>
              <li>
                <strong>My Boat</strong>
                <span>
                  See your boat, documents, marina details, engine hours and
                  upcoming service information.
                </span>
              </li>
              <li>
                <strong>Boat status</strong>
                <span>
                  Check fuel, water, batteries, cleaning and maintenance before
                  you leave home.
                </span>
              </li>
              <li>
                <strong>Request services</strong>
                <span>
                  Arrange cleaning, fueling, maintenance, supplies and pre-trip
                  checks from one place.
                </span>
              </li>
              <li>
                <strong>Prepare every trip</strong>
                <span>
                  Share dates, guests, destination and everything you want ready
                  onboard.
                </span>
              </li>
              <li>
                <strong>Food & drinks</strong>
                <span>
                  Select provisioning packages and have them delivered to your
                  boat before arrival.
                </span>
              </li>
            </ul>
          </div>
          <div className="app-wireframe-stage">
            <img
              className="app-wireframe app-wireframe--catalog"
              src="/images/my-cresta-app/boat-detail.png"
              alt="My Cresta App boat specifications screen"
            />
            <img
              className="app-wireframe app-wireframe--boat"
              src="/images/my-cresta-app/my-boat.png"
              alt="My Cresta App owner dashboard"
            />
            <img
              className="app-wireframe app-wireframe--service"
              src="/images/my-cresta-app/request-service.png"
              alt="My Cresta App service request screen"
            />
            <img
              className="app-wireframe app-wireframe--trip"
              src="/images/my-cresta-app/trip-preparation.png"
              alt="My Cresta App trip preparation screen"
            />
          </div>
        </section>

        <section className="my-cresta-team-access">
          <details id="team-access">
            <summary>Employee or ambassador? Request approved access.</summary>
            <div className="my-cresta-team-panel">
              <div>
                <span className="eyebrow">Professional access</span>
                <h2>Join the Cresta workspace.</h2>
                <p>
                  Employee and ambassador registrations are reviewed before
                  access is granted.
                </p>
              </div>
              <AccessRequestForm mode="team" />
            </div>
          </details>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
