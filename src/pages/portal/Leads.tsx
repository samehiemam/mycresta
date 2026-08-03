import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";
import { emailProblem, phoneProblem } from "../../lib/validate";

type Lead = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  stage: string;
  stageLabel: string;
  source: string;
  ambassador: string | null;
  isHouse: boolean;
  dealValue: number | null;
  currency: string;
  updatedAt: string;
};

function when(value: string): string {
  return new Date(value.replace(" ", "T") + "Z").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function Leads() {
  useTitle("Leads and deals | My Cresta");
  const { api, user } = useAuth();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [stages, setStages] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isStaff, setIsStaff] = useState(false);
  const [canOwn, setCanOwn] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<{
      leads: Lead[];
      stages: Record<string, string>;
      counts: Record<string, number>;
      isStaff: boolean;
      canOwn: boolean;
    }>("leads", "list", { stage: filter, search });
    setLeads(r.leads);
    setStages(r.stages);
    setCounts(r.counts);
    setIsStaff(r.isStaff);
    setCanOwn(r.canOwn);
  }, [api, filter, search]);

  useEffect(() => {
    load().catch((caught: Error) => setError(caught.message));
  }, [load]);

  async function move(id: string, stage: string) {
    setBusy(id);
    setError(null);
    setNotice(null);
    try {
      await api("leads", "stage", { id, stage });
      await load();
      setNotice(`Moved to ${stages[stage] ?? stage}.`);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <SiteHeader />
      <main className="portal-page">
        <span className="eyebrow">My Cresta</span>
        <h1>Leads and deals</h1>
        <p className="portal-intro">
          {isStaff
            ? "Every lead, house and ambassador-owned, from first contact to delivery."
            : "Your own leads. The first ambassador to register a contact owns it permanently."}
        </p>

        {notice && <p className="portal-notice">{notice}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="leads-toolbar">
          <button
            className="button button--primary"
            type="button"
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? "Cancel" : "Register a lead"}
          </button>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All stages ({total})</option>
            {Object.entries(stages).map(([key, label]) => (
              <option key={key} value={key}>
                {label} ({counts[key] ?? 0})
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {adding && (
          <RegisterLead
            onCancel={() => setAdding(false)}
            onDone={async (message) => {
              setAdding(false);
              await load();
              setNotice(message);
            }}
          />
        )}

        {!leads && !error && <p className="portal-loading">Loading…</p>}
        {leads?.length === 0 && (
          <p className="portal-empty">
            Nothing here yet. Register a lead, or wait for a configuration to
            arrive from the website.
          </p>
        )}

        {leads && leads.length > 0 && (
          <div className="scroller">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Stage</th>
                  {isStaff && <th>Owner</th>}
                  <th>Value</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.fullName}</strong>
                      {l.email && <small>{l.email}</small>}
                      {l.phone && <small>{l.phone}</small>}
                    </td>
                    <td>
                      <span className={`stage-pill is-${l.stage}`}>{l.stageLabel}</span>
                    </td>
                    {isStaff && (
                      <td>
                        {/* A house lead is a state with an owner, not a blank. */}
                        {l.isHouse ? (
                          <span className="house-tag">House</span>
                        ) : (
                          l.ambassador
                        )}
                      </td>
                    )}
                    <td className="is-figure">
                      {l.dealValue === null
                        ? "—"
                        : `${l.currency} ${(l.dealValue / 100).toLocaleString("en-GB", {
                            maximumFractionDigits: 0,
                          })}`}
                    </td>
                    <td>{when(l.updatedAt)}</td>
                    <td>
                      <select
                        aria-label={`Move ${l.fullName} to another stage`}
                        value={l.stage}
                        disabled={busy === l.id}
                        onChange={(e) => void move(l.id, e.target.value)}
                      >
                        {Object.entries(stages).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canOwn && leads && leads.length > 0 && (
          <p className="portal-hint">
            Only a Founder can reassign a lead, and the reason is kept on the
            record. Ask if you need one moved.
          </p>
        )}
        {user?.role === "ambassador" && (
          <p className="portal-hint">
            Marking a deal delivered is done by Cresta staff, since it makes your
            commission payable.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function RegisterLead({
  onDone,
  onCancel,
}: {
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const { api } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("ambassador");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = emailProblem(email);
  const phoneError = phoneProblem(phone);
  // One contact route is enough; demanding both loses leads at the door.
  const ready =
    fullName.trim() !== "" &&
    (email.trim() !== "" || phone.trim() !== "") &&
    !emailError &&
    !phoneError;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("leads", "create", { fullName, email, phone, source, notes });
      onDone(`${fullName} registered. This lead is yours.`);
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="quick-create" onSubmit={submit}>
      <h2>Register a lead</h2>
      <div className="quick-create-grid">
        <label>
          Full name
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className={emailError ? "is-invalid" : undefined}>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {emailError && <span className="field-error">{emailError}</span>}
        </label>
        <label className={phoneError ? "is-invalid" : undefined}>
          Mobile
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {phoneError && <span className="field-error">{phoneError}</span>}
        </label>
        <label>
          Source
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="ambassador">Ambassador</option>
            <option value="referral">Referral</option>
            <option value="website">Website</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <label className="quick-create-wide">
        Notes
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <p className="quick-create-note">
        An email address or a mobile number is enough. Registering claims the
        lead for you — permanently, unless a Founder moves it.
      </p>
      <div className="quick-create-actions">
        <button className="button button--primary" type="submit" disabled={!ready || busy}>
          {busy ? "Registering…" : "Register lead"}
        </button>
        <button className="button button--outline" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
