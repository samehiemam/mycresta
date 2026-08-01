import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

export default function Register() {
  useTitle("Create your account | My Cresta");
  const { api } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  // /register?role=ambassador arrives from the My Cresta page.
  const [role, setRole] = useState<"customer" | "ambassador">(
    searchParams.get("role") === "ambassador" ? "ambassador" : "customer",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      await api("auth", "register", {
        fullName: form.get("fullName"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password"),
        company: form.get("company"),
        message: form.get("message"),
        website: form.get("website"), // honeypot
        role,
      });
      // Sign in straight away so the verification step has a session.
      await api("auth", "login", {
        email: form.get("email"),
        password: form.get("password"),
      });
      navigate("/verify");
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="portal-auth">
        <section className="portal-auth-card portal-auth-card--wide">
          <span className="eyebrow">My Cresta</span>
          <h1>Create your account</h1>
          <p>
            We confirm both your email address and your mobile number, then a
            Cresta advisor activates your account.
          </p>

          <form onSubmit={submit} className="portal-form">
            <fieldset className="portal-role-choice">
              <legend>I am registering as</legend>
              <label className={role === "customer" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="role"
                  checked={role === "customer"}
                  onChange={() => setRole("customer")}
                />
                <span>
                  <strong>A customer</strong>
                  Saved builds, quotes, your boat and services
                </span>
              </label>
              <label className={role === "ambassador" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="role"
                  checked={role === "ambassador"}
                  onChange={() => setRole("ambassador")}
                />
                <span>
                  <strong>An ambassador</strong>
                  Introduce clients and follow your referrals
                </span>
              </label>
            </fieldset>

            <div className="portal-form-grid">
              <label>
                Full name
                <input name="fullName" required autoComplete="name" />
              </label>
              <label>
                Email address
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label>
                Mobile number
                <input
                  name="phone"
                  required
                  autoComplete="tel"
                  placeholder="+20 100 000 0000"
                />
              </label>
              <label>
                {role === "ambassador" ? "Company / network" : "Company (optional)"}
                <input name="company" autoComplete="organization" />
              </label>
            </div>

            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
              />
              <small className="portal-hint">
                At least 10 characters. A short phrase you will remember works
                well.
              </small>
            </label>

            <label>
              {role === "ambassador"
                ? "Tell us about your network"
                : "Which boat interests you? (optional)"}
              <textarea name="message" rows={3} />
            </label>

            <label className="access-consent">
              <input type="checkbox" required />
              <span>
                I agree that Cresta Marine may contact me about this account.
              </span>
            </label>

            <label className="access-honeypot" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              className="button button--primary button--full"
              type="submit"
              disabled={busy}
            >
              {busy ? "Creating your account…" : "Create account"}
            </button>
          </form>

          <div className="portal-auth-links">
            <Link href="/login">Already have an account? Sign in →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
