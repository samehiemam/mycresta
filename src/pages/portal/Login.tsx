import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth, roleHome, type PortalUser } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

export default function Login() {
  useTitle("Sign in | My Cresta");
  const { api } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const result = await api<{ user: PortalUser; active: boolean }>(
        "auth",
        "login",
        {
          email: form.get("email"),
          password: form.get("password"),
        },
      );
      if (!result.user.emailVerified || !result.user.phoneVerified) {
        navigate("/verify");
      } else if (!result.active) {
        navigate("/portal");
      } else {
        navigate(roleHome[result.user.role]);
      }
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="portal-auth">
        <section className="portal-auth-card">
          <span className="eyebrow">My Cresta</span>
          <h1>Sign in</h1>
          <p>Access your configurations, your boat and your Cresta team.</p>

          <form onSubmit={submit} className="portal-form">
            <label>
              Email address
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              className="button button--primary button--full"
              type="submit"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="portal-auth-links">
            <Link href="/forgot-password">Forgot your password?</Link>
            <Link href="/register">Create an account →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
