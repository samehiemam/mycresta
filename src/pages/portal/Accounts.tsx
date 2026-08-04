import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { PortalNav } from "./PortalLayout";
import { useAuth, type PortalUser, type Role } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

export default function Accounts() {
  useTitle("Account requests | My Cresta");
  const { api, user: me } = useAuth();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isAdmin = me?.role === "admin";

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/accounts.php?action=list", {
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok || data.ok === false) {
        throw new Error(data.error ?? "Could not load accounts.");
      }
      setUsers(data.users ?? []);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, decision: string, role?: Role) {
    setBusyId(id);
    setError(null);
    try {
      await api("accounts", "review", { id, decision, role });
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = users.filter((u) => u.status === "pending");
  const rest = users.filter((u) => u.status !== "pending");

  return (
    <>
      <SiteHeader />
      <main className="portal-page">
        <PortalNav />
        <header className="portal-page-head">
          <div>
            <span className="eyebrow">Cresta team</span>
            <h1>Account requests</h1>
            <p>
              Approve access for customers and ambassadors once they have
              confirmed their email address.
              {isAdmin
                ? " As an admin you can also change roles."
                : " Only an admin can change a role."}
            </p>
          </div>
        </header>

        {error && <p className="form-error">{error}</p>}

        <section className="account-table">
          <h2>
            Awaiting review <span>{pending.length}</span>
          </h2>
          {pending.length === 0 && <p className="portal-empty">Nothing waiting.</p>}
          {pending.map((row) => (
            <article className="account-row" key={row.id}>
              <div className="account-row-main">
                <strong>{row.fullName}</strong>
                <span>{row.email}</span>
                <span>{row.phone}</span>
                {row.company && <span>{row.company}</span>}
                <span className="account-row-when">
                  registered {new Date(row.createdAt + "Z").toLocaleString()}
                </span>
                {row.message && <span className="account-row-note">“{row.message}”</span>}
              </div>
              <div className="account-row-meta">
                <span className="portal-role-tag">
                  wants: {row.requestedRole}
                </span>
                <span className={row.emailVerified ? "verified" : "unverified"}>
                  email {row.emailVerified ? "confirmed" : "not confirmed yet"}
                </span>

              </div>
              <div className="account-row-actions">
                <button
                  className="button button--primary"
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void review(row.id, "approved")}
                >
                  Approve
                </button>
                <button
                  className="button button--outline"
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void review(row.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="account-table">
          <h2>
            All accounts <span>{rest.length}</span>
          </h2>
          {rest.map((row) => (
            <article className="account-row" key={row.id}>
              <div className="account-row-main">
                <strong>{row.fullName}</strong>
                <span>{row.email}</span>
                <span>{row.phone}</span>
              </div>
              <div className="account-row-meta">
                <span className="portal-role-tag">{row.role}</span>
                <span className={row.status === "approved" ? "verified" : "unverified"}>
                  {row.status}
                </span>
              </div>
              <div className="account-row-actions">
                {isAdmin && row.id !== me?.id && (
                  <>
                    <select
                      defaultValue=""
                      aria-label={`Change role for ${row.fullName}`}
                      onChange={(event) => {
                        const role = event.target.value as Role;
                        if (role) void review(row.id, "approved", role);
                      }}
                    >
                      <option value="">Change role…</option>
                      <option value="customer">Customer</option>
                      <option value="ambassador">Ambassador</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                    {row.status !== "disabled" && (
                      <button
                        className="button button--outline"
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void review(row.id, "disabled")}
                      >
                        Disable
                      </button>
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
