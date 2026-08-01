import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth, roleHome } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

type Channel = "email" | "phone";

/** One code entry panel; used for both the email and the mobile number. */
function ChannelPanel({
  channel,
  destination,
  verified,
}: {
  channel: Channel;
  destination: string;
  verified: boolean;
}) {
  const { api } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const code = new FormData(event.currentTarget).get("code");
    try {
      await api("auth", "verify", { channel, code });
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setNotice(null);
    try {
      const result = await api<{ sent: boolean; manualReview?: boolean }>(
        "auth",
        "send-code",
        { channel },
      );
      setNotice(
        result.manualReview
          ? "We could not send an SMS automatically. A Cresta advisor will confirm your number by WhatsApp shortly."
          : "A new code is on its way.",
      );
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  if (verified) {
    return (
      <div className="verify-panel verify-panel--done">
        <span className="verify-check" aria-hidden="true">
          ✓
        </span>
        <div>
          <strong>{channel === "email" ? "Email address" : "Mobile number"} confirmed</strong>
          <small>{destination}</small>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-panel">
      <div className="verify-panel-head">
        <strong>
          Confirm your {channel === "email" ? "email address" : "mobile number"}
        </strong>
        <small>{destination}</small>
      </div>
      <form onSubmit={submit} className="verify-form">
        <label>
          <span className="sr-only">6-digit code</span>
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            required
            autoComplete="one-time-code"
          />
        </label>
        <button className="button button--primary" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Confirm"}
        </button>
      </form>
      <button type="button" className="verify-resend" onClick={resend}>
        Send a new code
      </button>
      {notice && <p className="verify-notice">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function Verify() {
  useTitle("Confirm your details | My Cresta");
  const { user, active, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const bothConfirmed = user.emailVerified && user.phoneVerified;

  return (
    <>
      <SiteHeader />
      <main className="portal-auth">
        <section className="portal-auth-card">
          <span className="eyebrow">My Cresta</span>
          <h1>Confirm your details</h1>
          <p>
            We sent a 6-digit code to each. Both are needed before your account
            can be activated.
          </p>

          <ChannelPanel
            channel="email"
            destination={user.email}
            verified={user.emailVerified}
          />
          <ChannelPanel
            channel="phone"
            destination={user.phone}
            verified={user.phoneVerified}
          />

          {bothConfirmed && (
            <div className="verify-complete">
              {active ? (
                <>
                  <p>Both confirmed — your account is ready.</p>
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
                  Both confirmed. A Cresta advisor is reviewing your account and
                  will activate it shortly — we will email you.
                </p>
              )}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
