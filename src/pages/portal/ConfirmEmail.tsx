import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { useAuth, roleHome, type PortalUser } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

/** Landing page for the link in the confirmation email. */
export default function ConfirmEmail() {
  useTitle("Confirming your email | My Cresta");
  const { api, refresh, user: signedInUser } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<"working" | "done" | "failed">("working");
  const [message, setMessage] = useState<string | null>(null);
  const [user, setUser] = useState<PortalUser | null>(null);
  const [active, setActive] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    // Guard: React runs effects twice in development, and the token is
    // single-use — a second call would report it as already spent.
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setState("failed");
      setMessage("This link is incomplete. Please use the link from your email.");
      return;
    }

    api<{ account: PortalUser; active: boolean }>("auth", "confirm-email", { token })
      .then(async (result) => {
        setUser(result.account);
        setActive(result.active);
        // Picks up a session if this is the same browser that registered.
        await refresh();
        setState("done");
      })
      .catch((caught: Error) => {
        setMessage(caught.message);
        setState("failed");
      });
  }, [api, refresh, token]);

  return (
    <>
      <SiteHeader />
      <main className="portal-auth">
        <section className="portal-auth-card">
          <span className="eyebrow">My Cresta</span>

          {state === "working" && (
            <>
              <h1>Confirming your email…</h1>
              <p className="portal-loading">One moment.</p>
            </>
          )}

          {state === "done" && (
            <>
              <h1>Email confirmed</h1>
              {active && signedInUser ? (
                <>
                  <p>
                    Your account is ready
                    {user ? `, ${user.fullName.split(" ")[0]}` : ""}.
                  </p>
                  <button
                    className="button button--primary button--full"
                    type="button"
                    onClick={() => navigate(user ? roleHome[user.role] : "/portal")}
                  >
                    Go to My Cresta
                  </button>
                </>
              ) : active ? (
                <>
                  <p>
                    Your account is ready
                    {user ? `, ${user.fullName.split(" ")[0]}` : ""}. Sign in to
                    continue.
                  </p>
                  <Link className="button button--primary button--full" href="/login">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  <p>
                    Thank you — your email address is confirmed. A Cresta advisor
                    is reviewing your account and will activate it shortly.
                  </p>
                  <Link className="button button--outline button--full" href="/">
                    Back to the site
                  </Link>
                </>
              )}
            </>
          )}

          {state === "failed" && (
            <>
              <h1>That link did not work</h1>
              <p className="form-error">{message}</p>
              <Link className="button button--primary button--full" href="/login">
                Sign in to send a new link
              </Link>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
