"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AccessUser, UserRole } from "../../db/users";

type DirectoryFilter = "all" | "client" | "ambassador" | "pending";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  role: "client" as Extract<UserRole, "client" | "ambassador">,
  company: "",
};

export function EmployeeAccountDirectory({
  initialUsers,
}: {
  initialUsers: AccessUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<DirectoryFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const visibleUsers = useMemo(() => {
    if (filter === "all") return users;
    if (filter === "pending") {
      return users.filter(
        (user) =>
          user.requestedRole === "ambassador" && user.status === "pending",
      );
    }
    return users.filter((user) => user.requestedRole === filter);
  }, [filter, users]);

  const counts = useMemo(
    () => ({
      clients: users.filter(
        (user) =>
          user.requestedRole === "client" && user.status === "approved",
      ).length,
      ambassadors: users.filter(
        (user) =>
          user.requestedRole === "ambassador" && user.status === "approved",
      ).length,
      pending: users.filter(
        (user) =>
          user.requestedRole === "ambassador" && user.status === "pending",
      ).length,
    }),
    [users],
  );

  async function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking("create");
    setMessage("");
    try {
      const response = await fetch("/api/account-users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        user?: AccessUser;
        error?: string;
      };
      if (!response.ok || !result.user) {
        throw new Error(result.error || "Unable to add account");
      }
      setUsers((items) => [
        result.user!,
        ...items.filter((item) => item.email !== result.user!.email),
      ]);
      setForm(emptyForm);
      setShowForm(false);
      setMessage(
        `${result.user.fullName} was added as an active ${result.user.requestedRole}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to add account",
      );
    } finally {
      setWorking(null);
    }
  }

  async function reviewAmbassador(
    id: string,
    status: "approved" | "rejected",
  ) {
    setWorking(id);
    setMessage("");
    try {
      const response = await fetch("/api/account-users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = (await response.json()) as {
        user?: AccessUser;
        error?: string;
      };
      if (!response.ok || !result.user) {
        throw new Error(result.error || "Unable to review application");
      }
      setUsers((items) =>
        items.map((item) => (item.id === id ? result.user! : item)),
      );
      setMessage(
        `${result.user.fullName}'s ambassador application was ${status}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to review application",
      );
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="employee-account-directory">
      <div className="portal-metrics">
        <article>
          <span>Active clients</span>
          <strong>{counts.clients}</strong>
          <small>Customer accounts</small>
        </article>
        <article>
          <span>Active ambassadors</span>
          <strong>{counts.ambassadors}</strong>
          <small>Approved partners</small>
        </article>
        <article>
          <span>Awaiting approval</span>
          <strong>{counts.pending}</strong>
          <small>Ambassador applications</small>
        </article>
      </div>

      <article className="portal-panel portal-panel--table account-directory-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Account directory</span>
            <h2>Clients & ambassadors</h2>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={() => setShowForm((value) => !value)}
          >
            {showForm ? "Close form" : "Add an account"}
          </button>
        </div>

        {showForm && (
          <form className="employee-account-form" onSubmit={addAccount}>
            <div className="employee-account-form-heading">
              <div>
                <span className="portal-panel-label">New account</span>
                <h3>Add a client or ambassador</h3>
              </div>
              <p>
                Accounts added by an employee are approved and active
                immediately.
              </p>
            </div>
            <div className="employee-account-form-grid">
              <label>
                Full name
                <input
                  required
                  value={form.fullName}
                  onChange={(event) =>
                    setForm({ ...form, fullName: event.target.value })
                  }
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>
              <label>
                Mobile
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </label>
              <label>
                Account type
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as typeof form.role,
                    })
                  }
                >
                  <option value="client">Client</option>
                  <option value="ambassador">Ambassador</option>
                </select>
              </label>
              <label className="employee-account-form-company">
                Company or notes
                <input
                  value={form.company}
                  onChange={(event) =>
                    setForm({ ...form, company: event.target.value })
                  }
                />
              </label>
            </div>
            <button
              className="button button--primary"
              disabled={working === "create"}
              type="submit"
            >
              {working === "create" ? "Adding…" : "Create active account"}
            </button>
          </form>
        )}

        <div className="account-directory-filters" aria-label="Filter accounts">
          {(["all", "client", "ambassador", "pending"] as const).map(
            (value) => (
              <button
                className={filter === value ? "is-selected" : ""}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value === "all"
                  ? "All accounts"
                  : value === "client"
                    ? "Clients"
                    : value === "ambassador"
                      ? "Ambassadors"
                      : "Awaiting approval"}
              </button>
            ),
          )}
        </div>

        {message && <p className="account-directory-message">{message}</p>}

        <div className="account-directory-table">
          <div className="account-directory-row account-directory-row--header">
            <span>Account</span>
            <span>Type</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {visibleUsers.length === 0 && (
            <div className="account-directory-empty">
              No accounts match this view.
            </div>
          )}
          {visibleUsers.map((account) => (
            <div className="account-directory-row" key={account.id}>
              <div>
                <strong>{account.fullName}</strong>
                <small>{account.email}</small>
              </div>
              <span>{account.requestedRole}</span>
              <strong
                className={`request-status request-status--${account.status}`}
              >
                {account.status}
              </strong>
              <div className="account-directory-actions">
                {account.requestedRole === "ambassador" &&
                account.status === "pending" ? (
                  <>
                    <button
                      disabled={working === account.id}
                      onClick={() =>
                        reviewAmbassador(account.id, "approved")
                      }
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      disabled={working === account.id}
                      onClick={() =>
                        reviewAmbassador(account.id, "rejected")
                      }
                      type="button"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span>Managed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
