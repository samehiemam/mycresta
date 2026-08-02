import { Navigate } from "react-router-dom";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth, roleHome, type Role } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

/**
 * Gate for every portal page. The server enforces this too — this only keeps
 * the UI honest and sends people to the right next step.
 */
export function RequireAuth({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user, active, loading } = useAuth();

  if (loading) {
    return (
      <main className="portal-auth">
        <p className="portal-loading">Loading…</p>
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  // Email only. The phone check is a leftover from the SMS codes we dropped in
  // favour of the emailed link: the server stopped requiring it, but this did
  // not, so any account whose number was never ticked off — including a
  // Founder let in by the admin bootstrap — was sent back to /verify forever.
  if (!user.emailVerified) {
    return <Navigate to="/verify" replace />;
  }
  if (!active) return <PendingApproval />;
  if (!roles.includes(user.role)) {
    return <Navigate to={roleHome[user.role]} replace />;
  }
  return <>{children}</>;
}

/** Shown once both channels are confirmed but an advisor has not approved yet. */
function PendingApproval() {
  const { user, logout } = useAuth();
  useTitle("Account under review | My Cresta");
  return (
    <>
      <SiteHeader />
      <main className="portal-auth">
        <section className="portal-auth-card">
          <span className="eyebrow">My Cresta</span>
          <h1>Your account is under review</h1>
          <p>
            Thank you {user?.fullName.split(" ")[0]} — your email address and
            mobile number are confirmed. A Cresta advisor is reviewing your
            request and we will email you as soon as it is active.
          </p>
          <a
            className="button button--primary button--full"
            href="https://wa.me/201224212222"
            target="_blank"
            rel="noreferrer"
          >
            Ask about my account on WhatsApp
          </a>
          <button className="verify-resend" type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function PortalShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  return (
    <>
      <SiteHeader />
      <main className="portal-page">
        <header className="portal-page-head">
          <div>
            <span className="eyebrow">My Cresta</span>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
          <div className="portal-identity">
            <strong>{user?.fullName}</strong>
            <small>{user?.email}</small>
            <span className="portal-role-tag">{user?.role}</span>
            <button type="button" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        </header>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

/** Placeholder card for a module that lands in a later phase. */
function SoonCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="portal-card portal-card--soon">
      <h2>{title}</h2>
      <p>{body}</p>
      <span className="portal-soon-tag">Coming next</span>
    </article>
  );
}

export function CustomerPortal() {
  useTitle("My Cresta");
  const { user } = useAuth();
  return (
    <PortalShell
      title={`Welcome, ${user?.fullName.split(" ")[0] ?? ""}`}
      intro="Your configurations, your boat and your Cresta services."
    >
      <div className="portal-grid">
        <article className="portal-card">
          <h2>Start a configuration</h2>
          <p>Build your specification and send it to your advisor for a quote.</p>
          <Link className="button button--primary" href="/configure">
            Open the configurator
          </Link>
        </article>
        <SoonCard
          title="Saved builds & quotes"
          body="Every configuration you save, with the quote your advisor prepares."
        />
        <SoonCard
          title="My boat"
          body="Engine hours, fuel, service status, documents and invoices."
        />
        <SoonCard
          title="Service & trips"
          body="Request cleaning, fuelling and maintenance, and plan your next trip."
        />
      </div>
    </PortalShell>
  );
}

export function TeamPortal() {
  useTitle("Cresta team | My Cresta");
  return (
    <PortalShell
      title="Cresta team"
      intro="Leads, accounts, boats and service coordination."
    >
      <div className="portal-grid">
        <article className="portal-card">
          <h2>Account requests</h2>
          <p>Review and approve customer and ambassador registrations.</p>
          <Link className="button button--primary" href="/portal/accounts">
            Review accounts
          </Link>
        </article>
        <SoonCard
          title="Leads & quotes"
          body="Incoming quote requests with the full configuration and internal pricing."
        />
        <SoonCard
          title="Customers & boats"
          body="Owner records, hull numbers, delivery dates and boat status."
        />
        <SoonCard
          title="Service providers"
          body="Mercury, fibreglass, electrical and the rest of your contact book."
        />
      </div>
    </PortalShell>
  );
}

export function AmbassadorPortal() {
  useTitle("Ambassador | My Cresta");
  return (
    <PortalShell
      title="Ambassador"
      intro="Introduce clients, follow your referrals and track commission."
    >
      <div className="portal-grid">
        <article className="portal-card">
          <h2>Build a specification</h2>
          <p>Configure a boat with list pricing to share with your prospect.</p>
          <Link className="button button--primary" href="/configure">
            Open the configurator
          </Link>
        </article>
        <SoonCard
          title="My referrals"
          body="Register a prospect and follow it from introduction to closed sale."
        />
        <SoonCard
          title="Commission"
          body="What is pending, what is approved by Cresta and what has been paid."
        />
        <SoonCard
          title="Marketing materials"
          body="Brochures and imagery approved for sharing with clients."
        />
      </div>
    </PortalShell>
  );
}
