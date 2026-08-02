import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";
import { emailProblem, passwordProblem } from "../../lib/validate";

/**
 * Where a one-time code becomes a password.
 *
 * Reached by anyone an admin has created or reset — they cannot sign in yet,
 * so this page is public. The code is the credential.
 */
export default function SetPassword() {
  useTitle("Choose your password | My Cresta");
  const { api } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const emailError = emailProblem(email);
  const passwordError = passwordProblem(password);
  const mismatch = confirm !== "" && confirm !== password;
  const ready =
    email.trim() !== "" &&
    !emailError &&
    code.replace(/\D/g, "").length === 6 &&
    password !== "" &&
    !passwordError &&
    !mismatch;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("auth", "set-password", { email, code, password });
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

          {done ? (
            <>
              <h1>Password set</h1>
              <p>You can sign in now.</p>
              <button
                className="button button--primary button--full"
                type="button"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              <h1>Choose your password</h1>
              <p>
                Enter the six-digit code from your email and pick a password.
                The code lasts twenty minutes and works once.
              </p>

              <form
                className="portal-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (ready) void submit();
                }}
              >
                <label className={emailError ? "is-invalid" : undefined}>
                  Email address
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {emailError && <span className="field-error">{emailError}</span>}
                </label>

                <label>
                  Six-digit code
                  <input
                    className="otp-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </label>

                <label className={passwordError ? "is-invalid" : undefined}>
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {passwordError && (
                    <span className="field-error">{passwordError}</span>
                  )}
                </label>

                <label className={mismatch ? "is-invalid" : undefined}>
                  Confirm password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  {mismatch && (
                    <span className="field-error">The two passwords do not match.</span>
                  )}
                </label>

                {error && <p className="form-error">{error}</p>}

                <button
                  className="button button--primary button--full"
                  type="submit"
                  disabled={!ready || busy}
                >
                  {busy ? "Setting…" : "Set my password"}
                </button>
              </form>

              <p className="portal-hint">
                No code, or it expired? Ask whoever set up your account to send
                a new one, or use <Link href="/forgot-password">forgot password</Link>.
              </p>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
