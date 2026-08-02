import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth, roleHome } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

/**
 * Shown after registering: the account exists, the confirmation email is on its
 * way, and there is nothing to type — the link in the email does the work.
 */
export default function Verify() {
  useTitle("Confirm your email | My Cresta");
  const { user, active, loading, api, logout } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  async function resend() {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      await api("auth", "resend-confirmation");
      setNotice("Sent. It can take a minute to arrive — check your spam folder.");
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (user.emailVerified) {
    return (
      <>
        <SiteHeader />
        <main className="portal-auth">
          <section className="portal-auth-card">
            <span className="eyebrow">My Cresta</span>
            <h1>Email confirmed</h1>
            {active ? (
              <>
                <p>Your account is ready.</p>
                <button
                  className="button button--primary button--full"
                  type="button"
                  onClick={() => navigate(roleHome[user.role])}
                >
                  Go to My Cresta
                </button>
              </>
            ) : (
              <p>
                A Cresta advisor is reviewing your account and will activate it
                shortly — we will email you.
              </p>
            )}
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="portal-auth">
        <section className="portal-auth-card">
          <span className="eyebrow">My Cresta</span>
          <h1>Check your email</h1>
          <p>
            We sent a confirmation link to <strong>{user.email}</strong>. Open it
            and your account is confirmed — there is no code to type.
          </p>

          <div className="verify-panel">
            <div className="verify-panel-head">
              <strong>Not arrived?</strong>
              <small>
                It can take a minute. Check your spam folder before resending.
              </small>
            </div>
            <button
              className="button button--outline button--full"
              type="button"
              onClick={() => void resend()}
              disabled={busy}
            >
              {busy ? "Sending…" : "Send the link again"}
            </button>
            {notice && <p className="verify-notice">{notice}</p>}
            {error && <p className="form-error">{error}</p>}
          </div>

          <p className="portal-hint">
            We will also call or WhatsApp {user.phone} to introduce ourselves.
          </p>

          <button className="verify-resend" type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
