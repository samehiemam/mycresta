"use client";

import { useMemo, useState } from "react";
import type { AccessUser, UserStatus } from "../../db/users";

export function AdminAccessRequests({
  initialUsers,
}: {
  initialUsers: AccessUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<"all" | UserStatus>("pending");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      filter === "all"
        ? users
        : users.filter((user) => user.status === filter),
    [filter, users],
  );

  async function review(id: string, status: "approved" | "rejected") {
    setWorkingId(id);
    try {
      const response = await fetch("/api/access-requests", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error("Unable to review");
      setUsers((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                approvedRole:
                  status === "approved" ? item.requestedRole : null,
              }
            : item,
        ),
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="admin-requests">
      <div className="admin-filter" aria-label="Filter access requests">
        {(["pending", "approved", "rejected", "all"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "is-selected" : ""}
            onClick={() => setFilter(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="admin-request-list">
        {visible.length === 0 && (
          <div className="admin-empty">No {filter} access requests.</div>
        )}
        {visible.map((user) => (
          <article className="admin-request-card" key={user.id}>
            <header>
              <div>
                <span>{user.requestedRole}</span>
                <h2>{user.fullName}</h2>
              </div>
              <strong className={`request-status request-status--${user.status}`}>
                {user.status}
              </strong>
            </header>
            <dl>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>{user.phone}</dd>
              </div>
              <div>
                <dt>Company / department</dt>
                <dd>{user.company || "—"}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{new Date(user.createdAt).toLocaleDateString("en-GB")}</dd>
              </div>
            </dl>
            {user.message && <p>{user.message}</p>}
            {user.status === "pending" && (
              <div className="admin-review-actions">
                <button
                  className="button button--primary"
                  type="button"
                  disabled={workingId === user.id}
                  onClick={() => review(user.id, "approved")}
                >
                  Approve {user.requestedRole}
                </button>
                <button
                  className="button button--outline"
                  type="button"
                  disabled={workingId === user.id}
                  onClick={() => review(user.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
