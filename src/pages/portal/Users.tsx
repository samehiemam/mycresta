import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";
import { emailProblem, phoneProblem } from "../../lib/validate";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  requestedRole: string;
  status: "pending" | "approved" | "rejected" | "disabled";
  company: string | null;
  scopes: string[];
  emailVerified: boolean;
  hasPassword: boolean;
  otpPending: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const STATUSES = ["pending", "approved", "rejected", "disabled"] as const;

/** Turns a role plus its scopes into the job title people actually use. */
function describe(user: AdminUser): string {
  if (user.role === "admin") return "Founder";
  if (user.role === "employee") {
    if (user.scopes.includes("sales")) return "Advisor";
    if (user.scopes.includes("finance")) return "Finance";
    if (user.scopes.includes("boat_staff")) return "Boat staff";
    if (user.scopes.includes("service")) return "Service";
    if (user.scopes.includes("marketing")) return "Marketing";
    return "Employee (no scope)";
  }
  if (user.role === "ambassador") return "Ambassador";
  return "Customer";
}

function when(value: string | null): string {
  if (!value) return "—";
  return new Date(value.replace(" ", "T") + "Z").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Users() {
  useTitle("Users | My Cresta");
  const { api } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);
  const [me, setMe] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<{
      users: AdminUser[];
      roles: string[];
      scopes: string[];
      me: string;
    }>("users", "list");
    setUsers(r.users);
    setRoles(r.roles);
    setScopes(r.scopes);
    setMe(r.me);
  }, [api]);

  useEffect(() => {
    load().catch((caught: Error) => setError(caught.message));
  }, [load]);

  async function run(id: string, fn: () => Promise<unknown>, message: string) {
    setBusy(id);
    setError(null);
    setNotice(null);
    try {
      await fn();
      await load();
      setNotice(message);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="portal-page">
        <span className="eyebrow">My Cresta</span>
        <h1>Users</h1>
        <p className="portal-intro">
          Everyone with access to My Cresta. Passwords are never set here — a
          new account, or a reset, sends a one-time code to that person so they
          choose their own.
        </p>

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="portal-notice">{notice}</p>}

        <div className="users-toolbar">
          <button
            className="button button--primary"
            type="button"
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? "Cancel" : "Add a user"}
          </button>
          <span>{users?.length ?? 0} accounts</span>
        </div>

        {adding && (
          <AddUser
            roles={roles}
            scopes={scopes}
            onDone={async (message) => {
              setAdding(false);
              await load();
              setNotice(message);
            }}
          />
        )}

        {!users && !error && <p className="portal-loading">Loading…</p>}

        {users && (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Sign-in</th>
                <th>Last seen</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <>
                  <tr key={u.id} className={u.id === me ? "is-me" : undefined}>
                    <td>
                      <strong>{u.fullName}</strong>
                      <small>{u.email}</small>
                      {u.phone && <small>{u.phone}</small>}
                    </td>
                    <td>
                      {describe(u)}
                      {u.scopes.length > 0 && (
                        <small>{u.scopes.join(", ")}</small>
                      )}
                    </td>
                    <td>
                      <span className={`user-status is-${u.status}`}>{u.status}</span>
                      {u.id === me && <small>you</small>}
                    </td>
                    <td>
                      {/* An account with no password cannot be signed into yet;
                          saying so avoids "why can't they log in?". */}
                      {!u.hasPassword ? (
                        <span className="user-flag is-warn">no password yet</span>
                      ) : u.emailVerified ? (
                        <span className="user-flag is-ok">ready</span>
                      ) : (
                        <span className="user-flag is-warn">email unconfirmed</span>
                      )}
                      {u.otpPending && <small>code sent, unused</small>}
                    </td>
                    <td>{when(u.lastLoginAt)}</td>
                    <td className="users-actions">
                      <button
                        className="button button--outline"
                        type="button"
                        onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                      >
                        {expanded === u.id ? "Close" : "Edit"}
                      </button>
                      <button
                        className="button button--outline"
                        type="button"
                        disabled={busy === u.id}
                        onClick={() =>
                          run(
                            u.id,
                            () => api("users", "send-code", { id: u.id }),
                            `A one-time code has been emailed to ${u.email}.`,
                          )
                        }
                      >
                        {u.hasPassword ? "Reset password" : "Send code"}
                      </button>
                    </td>
                  </tr>
                  {expanded === u.id && (
                    <tr className="users-edit-row" key={`${u.id}-edit`}>
                      <td colSpan={6}>
                        <EditUser
                          user={u}
                          roles={roles}
                          scopes={scopes}
                          isMe={u.id === me}
                          busy={busy === u.id}
                          onSave={(values) =>
                            run(
                              u.id,
                              () => api("users", "update", { id: u.id, ...values }),
                              `${u.fullName} updated.`,
                            )
                          }
                          onDelete={() =>
                            run(
                              u.id,
                              () => api("users", "delete", { id: u.id }),
                              `${u.fullName} deleted.`,
                            )
                          }
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function AddUser({
  roles,
  scopes,
  onDone,
}: {
  roles: string[];
  scopes: string[];
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = emailProblem(email);
  const phoneError = phoneProblem(phone);
  const ready = fullName.trim() !== "" && email.trim() !== "" && !emailError && !phoneError;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("users", "create", {
        fullName,
        email,
        phone,
        role,
        scopes: role === "employee" ? chosen : [],
      });
      onDone(`${fullName} created — a one-time code has been emailed to ${email}.`);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="user-form">
      <h2>New user</h2>
      <div className="user-form-grid">
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      {role === "employee" && (
        <fieldset className="scope-picker">
          <legend>Scopes — these decide what an employee actually sees</legend>
          {scopes.map((s) => (
            <label key={s}>
              <input
                type="checkbox"
                checked={chosen.includes(s)}
                onChange={() =>
                  setChosen((prev) =>
                    prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                  )
                }
              />
              {s}
            </label>
          ))}
        </fieldset>
      )}

      {error && <p className="form-error">{error}</p>}
      <p className="user-form-note">
        No password is set here. A one-time code goes to their email and they
        choose their own.
      </p>
      <button
        className="button button--primary"
        type="button"
        disabled={!ready || busy}
        onClick={() => void submit()}
      >
        {busy ? "Creating…" : "Create and send code"}
      </button>
    </section>
  );
}

function EditUser({
  user,
  roles,
  scopes,
  isMe,
  busy,
  onSave,
  onDelete,
}: {
  user: AdminUser;
  roles: string[];
  scopes: string[];
  isMe: boolean;
  busy: boolean;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState<string>(user.status);
  const [chosen, setChosen] = useState<string[]>(user.scopes);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="user-edit">
      <div className="user-edit-fields">
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {role === "employee" && (
          <fieldset className="scope-picker">
            <legend>Scopes</legend>
            {scopes.map((s) => (
              <label key={s}>
                <input
                  type="checkbox"
                  checked={chosen.includes(s)}
                  onChange={() =>
                    setChosen((prev) =>
                      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                    )
                  }
                />
                {s}
              </label>
            ))}
          </fieldset>
        )}
      </div>

      <div className="user-edit-actions">
        <button
          className="button button--primary"
          type="button"
          disabled={busy}
          onClick={() => onSave({ role, status, scopes: chosen })}
        >
          Save changes
        </button>

        {/* Deleting yourself is refused by the server too; the button is
            simply not offered, because an admin locking themselves out is the
            classic way to lose a system. */}
        {!isMe &&
          (confirming ? (
            <span className="user-delete-confirm">
              Delete {user.fullName} permanently?
              <button
                className="button button--danger"
                type="button"
                disabled={busy}
                onClick={onDelete}
              >
                Yes, delete
              </button>
              <button
                className="button button--outline"
                type="button"
                onClick={() => setConfirming(false)}
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              className="button button--outline"
              type="button"
              onClick={() => setConfirming(true)}
            >
              Delete user
            </button>
          ))}
      </div>

      <dl className="user-detail">
        <div>
          <dt>Requested</dt>
          <dd>{user.requestedRole}</dd>
        </div>
        <div>
          <dt>Company</dt>
          <dd>{user.company ?? "—"}</dd>
        </div>
        <div>
          <dt>Email confirmed</dt>
          <dd>{user.emailVerified ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{when(user.createdAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
