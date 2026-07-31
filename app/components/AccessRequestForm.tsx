"use client";

import { FormEvent, useState } from "react";

type AccessMode = "customer" | "team";
type RequestedRole = "client" | "employee" | "ambassador";

export function AccessRequestForm({ mode }: { mode: AccessMode }) {
  const [role, setRole] = useState<RequestedRole>(
    mode === "customer" ? "client" : "ambassador",
  );
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          email: form.get("email"),
          phone: form.get("phone"),
          role,
          company: form.get("company"),
          message: form.get("message"),
          website: form.get("website"),
          source: mode === "customer" ? "my-cresta" : "my-cresta-team",
        }),
      });
      if (!response.ok) throw new Error("Unable to submit");
      setStatus("sent");
      formElement.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="access-form-success" role="status">
        <span>✓</span>
        <h2>Request received.</h2>
        <p>
          Your profile is saved with a pending status. Cresta Marine will review
          the request before account access is approved.
        </p>
        <button
          className="button button--outline"
          type="button"
          onClick={() => setStatus("idle")}
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form className="access-request-form" onSubmit={submit}>
      {mode === "team" && (
        <fieldset>
          <legend>Access type</legend>
          <div className="access-role-choice">
            <label>
              <input
                type="radio"
                name="role"
                checked={role === "ambassador"}
                onChange={() => setRole("ambassador")}
              />
              <span>
                <strong>Ambassador</strong>
                Referrals, lead visibility and introductions
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="role"
                checked={role === "employee"}
                onChange={() => setRole("employee")}
              />
              <span>
                <strong>Employee</strong>
                Sales, customer and quotation workspace
              </span>
            </label>
          </div>
        </fieldset>
      )}

      <div className="access-form-grid">
        <label>
          Full name
          <input name="fullName" required autoComplete="name" />
        </label>
        <label>
          Email address
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Mobile / WhatsApp
          <input name="phone" required autoComplete="tel" />
        </label>
        <label>
          {role === "employee"
            ? "Department"
            : role === "ambassador"
              ? "Company / network"
              : "Company (optional)"}
          <input name="company" autoComplete="organization" />
        </label>
      </div>
      <label>
        {mode === "customer"
          ? "Tell us which boat interests you"
          : "Why are you requesting access?"}
        <textarea name="message" rows={4} />
      </label>
      <label className="access-consent">
        <input type="checkbox" required />
        <span>
          I agree that Cresta Marine may review and contact me about this account
          request.
        </span>
      </label>
      <label className="access-honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <button
        className="button button--primary button--full"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Submitting…" : "Request access"}
      </button>
      {status === "error" && (
        <p className="form-error">
          We could not submit the request. Please contact
          admin@crestamarine.com.
        </p>
      )}
    </form>
  );
}
