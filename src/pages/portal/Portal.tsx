import { Navigate } from "react-router-dom";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useEffect, useState } from "react";
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

/** A module that lands in a later phase. Named, so the gap is honest. */
function SoonCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="portal-card portal-card--soon">
      <h2>{title}</h2>
      <p>{body}</p>
      <span className="portal-soon-tag">Coming next</span>
    </article>
  );
}

/** A thing you can do right now, as opposed to a place you can go. */
function ActionCard({
  title,
  body,
  href,
  cta,
  onClick,
}: {
  title: string;
  body: string;
  href?: string;
  cta: string;
  onClick?: () => void;
}) {
  return (
    <article className="portal-card">
      <h2>{title}</h2>
      <p>{body}</p>
      {href ? (
        <Link className="button button--primary" href={href}>
          {cta}
        </Link>
      ) : (
        <button className="button button--primary" type="button" onClick={onClick}>
          {cta}
        </button>
      )}
    </article>
  );
}

/** The pipeline at a glance, straight from the API. */
function PipelineStrip() {
  const { api } = useAuth();
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [stages, setStages] = useState<Record<string, string>>({});

  useEffect(() => {
    api<{ counts: Record<string, number>; stages: Record<string, string> }>("leads", "list")
      .then((r) => {
        setCounts(r.counts);
        setStages(r.stages);
      })
      .catch(() => setCounts({}));
  }, [api]);

  if (!counts) return null;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <section className="pipeline-strip">
      <div className="pipeline-strip-head">
        <h2>Pipeline</h2>
        <Link href="/portal/leads">See all leads →</Link>
      </div>
      {total === 0 ? (
        <p className="portal-empty">
          No leads yet. Register one, or wait for a configuration to come in from
          the website.
        </p>
      ) : (
        <ol className="pipeline-counts">
          {Object.entries(stages).map(([key, label]) => (
            <li key={key} className={counts[key] ? "" : "is-empty"}>
              <b>{counts[key] ?? 0}</b>
              <span>{label}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * Create a member of staff, an ambassador or a customer.
 *
 * No password is set here and none is asked for — the person receives a
 * one-time code and chooses their own.
 */
function QuickCreate({
  role,
  label,
  onDone,
  onCancel,
}: {
  role: "customer" | "ambassador";
  label: string;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const { api } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("users", "create", { fullName, email, phone, role, scopes: [] });
      onDone(`${fullName} created — a one-time code has been emailed to ${email}.`);
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="quick-create" onSubmit={submit}>
      <h2>New {label}</h2>
      <div className="quick-create-grid">
        <label>
          Full name
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Mobile
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <p className="quick-create-note">
        They will receive a one-time code and choose their own password. You never
        set it.
      </p>
      <div className="quick-create-actions">
        <button className="button button--primary" type="submit" disabled={busy}>
          {busy ? "Creating…" : `Create ${label}`}
        </button>
        <button className="button button--outline" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
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
        <ActionCard
          title="Configure a boat"
          body="Build a Kumbra the way you would use it, then send it to your advisor."
          href="/configure"
          cta="Open the configurator"
        />
        <ActionCard
          title="My configurations"
          body="Everything you have built or been sent, with the full specification."
          href="/portal/builds"
          cta="View my configurations"
        />
        <SoonCard
          title="My boat"
          body="Once you take delivery: documents, service history and support, all in one place."
        />
      </div>
    </PortalShell>
  );
}

export function TeamPortal() {
  useTitle("Cresta team | My Cresta");
  const { user } = useAuth();
  const isFounder = user?.role === "admin";
  const [creating, setCreating] = useState<null | "customer" | "ambassador">(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <PortalShell
      title="Cresta team"
      intro="Configurations, leads, customers and the boat catalog."
    >
      {notice && <p className="portal-notice">{notice}</p>}

      {creating && (
        <QuickCreate
          role={creating}
          label={creating === "customer" ? "customer" : "ambassador"}
          onCancel={() => setCreating(null)}
          onDone={(message) => {
            setCreating(null);
            setNotice(message);
          }}
        />
      )}

      <div className="portal-grid">
        <ActionCard
          title="Create a configuration"
          body="Build a boat with the price list showing, then set the discount and shipping."
          href="/portal/configurator"
          cta="New configuration"
        />
        {isFounder && (
          <ActionCard
            title="Create a customer"
            body="Add a customer so a configuration can be shared with them."
            cta="New customer"
            onClick={() => { setNotice(null); setCreating("customer"); }}
          />
        )}
        {isFounder && (
          <ActionCard
            title="Create an ambassador"
            body="Bring an agent on board. They register leads and earn commission on delivery."
            cta="New ambassador"
            onClick={() => { setNotice(null); setCreating("ambassador"); }}
          />
        )}
        <ActionCard
          title="Client configurations"
          body="Boats customers built on the public website, with the price list revealed."
          href="/portal/builds"
          cta="Open client configurations"
        />
        <ActionCard
          title="Leads and deals"
          body="The pipeline from first contact through to delivery."
          href="/portal/leads"
          cta="Open the pipeline"
        />
        {isFounder && (
          <ActionCard
            title="Users"
            body="Everyone with access: roles, scopes, status, and password resets by code."
            href="/portal/users"
            cta="Manage users"
          />
        )}
        <ActionCard
          title="Account requests"
          body="Review and approve customer and ambassador registrations."
          href="/portal/accounts"
          cta="Review accounts"
        />
        <SoonCard
          title="Commissions"
          body="Finder and closer fees on delivered deals, with the approval workflow."
        />
      </div>

      <PipelineStrip />
    </PortalShell>
  );
}

export function AmbassadorPortal() {
  useTitle("Ambassador | My Cresta");
  const { user } = useAuth();

  return (
    <PortalShell
      title={`Welcome, ${user?.fullName.split(" ")[0] ?? ""}`}
      intro="Your leads, your configurations and your commission."
    >
      <div className="portal-grid">
        <ActionCard
          title="Register a lead"
          body="Add a prospect. The first ambassador to register a contact owns it permanently."
          href="/portal/leads"
          cta="Register a lead"
        />
        <ActionCard
          title="Build a configuration"
          body="Specify a boat for a prospect and share it with them."
          href="/portal/configurator"
          cta="New configuration"
        />
        <ActionCard
          title="My leads"
          body="Everything you own, by pipeline stage."
          href="/portal/leads"
          cta="Open my pipeline"
        />
        <SoonCard
          title="My commission"
          body="Finder and closer fees on your delivered deals, and what has been paid."
        />
      </div>

      <PipelineStrip />
    </PortalShell>
  );
}
