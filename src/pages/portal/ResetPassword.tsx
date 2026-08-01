import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

/** Request a reset link. Always reports success, so the form cannot be used
 *  to find out which email addresses have accounts. */
export function ForgotPassword() {
  useTitle("Forgot your password | My Cresta");
  const { api } = useAuth();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const email = new FormData(event.currentTarget).get("email");
    try {
      await api("auth", "forgot-password", { email });
    } catch {
      // Deliberately ignored: the reply is the same either way.
    }
    setSent(true);
    setBusy(false);
  }

  return (
    <>
      <SiteHeader />
      <main className="portal-auth">
        <section className="portal-auth-card">
          <span className="eyebrow">My Cresta</span>
          <h1>Forgot your password</h1>
          {sent ? (
            <>
              <p>
                If that email address has an account, a reset link is on its
                way. It is valid for 60 minutes.
              </p>
              <Link className="button button--outline button--full" href="/login">
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <p>Enter your email address and we will send you a reset link.</p>
              <form onSubmit={submit} className="portal-form">
                <label>
                  Email address
                  <input name="email" type="email" required autoComplete="email" />
                </label>
                <button
                  className="button button--primary button--full"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/** Set a new password from an emailed single-use token. */
export function ResetPassword() {
  useTitle("Set a new password | My Cresta");
  const { api } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("Those passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("auth", "reset-password", { token, password });
      setDone(true);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="portal-auth">
        <section className="portal-auth-card">
          <span className="eyebrow">My Cresta</span>
          <h1>Set a new password</h1>

          {!token && (
            <p className="form-error">
              This link is incomplete. Please use the link from your email.
            </p>
          )}

          {done ? (
            <>
              <p>
                Your password is set. For safety you have been signed out
                everywhere else.
              </p>
              <Link className="button button--primary button--full" href="/login">
                Sign in
              </Link>
            </>
          ) : (
            <form onSubmit={submit} className="portal-form">
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                />
                <small className="portal-hint">At least 10 characters.</small>
              </label>
              <label>
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button
                className="button button--primary button--full"
                type="submit"
                disabled={busy || !token}
              >
                {busy ? "Saving…" : "Save password"}
              </button>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
