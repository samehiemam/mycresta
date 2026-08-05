"use client";

import Link from "next/link";
import { useAuth, roleHome } from "../../src/lib/auth";
import { useEffect, useRef, useState } from "react";
import { boatsByBrand } from "../data";

type MenuId = "fleet" | "configure";

/**
 * Top-level nav item with a brand-grouped panel of models. On desktop the panel
 * opens on hover or focus; on the mobile menu it expands in place.
 */
function NavMenu({
  id,
  label,
  href,
  openMenu,
  setOpenMenu,
  onNavigate,
  hoverable,
  children,
}: {
  id: MenuId;
  label: string;
  href: string;
  openMenu: MenuId | null;
  setOpenMenu: (menu: MenuId | null) => void;
  onNavigate: () => void;
  hoverable: boolean;
  children: React.ReactNode;
}) {
  const open = openMenu === id;

  return (
    <div
      className={`nav-menu ${open ? "nav-menu--open" : ""}`}
      // Only hover-open with a real pointer; on touch the chevron toggles it.
      onMouseEnter={hoverable ? () => setOpenMenu(id) : undefined}
      onMouseLeave={hoverable ? () => setOpenMenu(null) : undefined}
    >
      <div className="nav-menu-head">
        <Link href={href} onClick={onNavigate}>
          {label}
        </Link>
        <button
          type="button"
          className="nav-menu-toggle"
          aria-expanded={open}
          aria-controls={`nav-panel-${id}`}
          aria-label={`${open ? "Hide" : "Show"} ${label.toLowerCase()} models`}
          onClick={() => setOpenMenu(open ? null : id)}
        >
          <span className="nav-menu-chevron" aria-hidden="true" />
        </button>
      </div>
      <div className="nav-menu-panel" id={`nav-panel-${id}`} hidden={!open}>
        {children}
      </div>
    </div>
  );
}

/**
 * User account menu: logged-in shows avatar with My Cresta & sign out,
 * logged-out shows quick login form.
 * On wide screen it's an icon that opens on click; on mobile it's a labelled
 * block in the vertical menu.
 */
function AccountMenu({ onNavigate }: { onNavigate: () => void }) {
  const { user, logout, api } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  // Close on an outside click or on Escape, the two things people try.
  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = user
    ? user.fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
    : "";

  const handleLogin = async () => {
    if (!email || !password || logging) return;

    setLogging(true);
    setError("");

    try {
      // Call auth API - it automatically updates user context on success
      const response = await api<{ ok?: boolean; user?: { role?: string }; active?: boolean }>(
        "auth",
        "login",
        { email, password }
      );

      // If we get here without error, login succeeded
      setEmail("");
      setPassword("");
      setOpen(false);
      onNavigate();

      // Navigate to the user's role-specific home page
      const userRole = response?.user?.role as keyof typeof roleHome;
      const profileUrl = (userRole && roleHome[userRole]) || "/my-cresta";
      window.location.href = profileUrl;
    } catch (err) {
      // The api function throws ApiError with the server message
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
      setLogging(false);
    }
  };

  return (
    <div className={`account-menu${open ? " is-open" : ""}`} ref={wrap}>
      <button
        className="account-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        aria-label={user ? `Account menu for ${user.fullName}` : "Account menu"}
        data-label="My Cresta Login"
      >
        {user ? (
          <span className="account-avatar">
            <svg
              className="profile-ring"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9.25" />
            </svg>
            <span className="initials-text">{initials || "?"}</span>
          </span>
        ) : (
          <span
            className="account-avatar account-avatar--anon"
            aria-hidden="true"
          />
        )}
        {/* Only the stacked menu shows these: a bare mark in a vertical list
            gives no clue what it opens, but beside the desktop marks a label
            would break the row. */}
        <span className="account-trigger-text">
          <span className="account-trigger-title">
            {user ? user.fullName : "My Cresta"}
          </span>
          <span className="account-trigger-sub">
            {user ? "My Cresta account" : "Sign in or register"}
          </span>
        </span>
        <span className="account-chevron" aria-hidden="true" />
      </button>

      <div className="account-panel" role="menu">
        {user ? (
          <div className="account-card">
            <div className="account-identity">
              <span className="account-identity-mark" aria-hidden="true">
                {initials || "?"}
              </span>
              <span className="account-identity-who">
                <strong>{user.fullName}</strong>
                <small>{user.email}</small>
              </span>
            </div>
            <div className="account-actions">
              <Link
                className="account-button account-button--primary"
                href={roleHome[user.role]}
                role="menuitem"
                onClick={() => { setOpen(false); onNavigate(); }}
              >
                Open My Cresta
              </Link>
              <button
                className="account-signout"
                type="button"
                role="menuitem"
                onClick={async () => {
                  setOpen(false);
                  onNavigate();
                  await logout();
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <form
            className="account-card"
            onSubmit={(event) => {
              event.preventDefault();
              void handleLogin();
            }}
          >
            <span className="account-card-eyebrow">My Cresta account</span>
            <h2 className="account-card-title">Sign in.</h2>

            {error && <p className="login-error" role="alert">{error}</p>}

            <label className="account-field">
              <span>User ID</span>
              {/* The server matches on the email address, so this stays a
                  username field rather than a strict email one — a browser
                  refusing the value before it is sent would be the worse
                  failure of the two. */}
              <input
                type="text"
                name="username"
                autoComplete="username"
                inputMode="email"
                placeholder="Enter your user ID"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={logging}
              />
            </label>

            <label className="account-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={logging}
              />
            </label>

            <div className="account-actions">
              <button
                className="account-button account-button--primary"
                type="submit"
                disabled={logging || !email || !password}
              >
                {logging ? "Signing in…" : "Sign in"}
              </button>
              <Link
                className="account-button account-button--ghost"
                href="/register"
                onClick={() => { setOpen(false); onNavigate(); }}
              >
                Register
              </Link>
            </div>

            <Link
              className="account-forgot"
              href="/forgot-password"
              onClick={() => { setOpen(false); onNavigate(); }}
            >
              Forgot password?
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export function SiteHeader({
  inverse = false,
  solid = false,
}: {
  inverse?: boolean;
  solid?: boolean;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [hoverable, setHoverable] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const fleet = boatsByBrand();

  useEffect(() => {
    setHoverable(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the panels on Escape or a click outside the header.
  useEffect(() => {
    if (!openMenu) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openMenu]);

  function closeAll() {
    setOpenMenu(null);
    setOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className={[
        "site-header",
        inverse ? "site-header--inverse" : "",
        solid ? "site-header--solid" : "",
        scrolled ? "is-scrolled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link className="brand-link" href="/" aria-label="Cresta Marine home">
        <img
          src={
            inverse
              ? "/images/cresta-logo-white.png"
              : "/images/cresta-logo-navy.png"
          }
          alt="Cresta Marine"
        />
      </Link>
      <button
        className="menu-button"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={`site-nav ${open ? "site-nav--open" : ""}`}>
        <NavMenu
          id="fleet"
          label="Fleet"
          href="/fleet"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          onNavigate={closeAll}
          hoverable={hoverable}
        >
          {fleet.map(({ brand, models }) => (
            <div className="nav-brand" key={brand.id}>
              <span className="nav-brand-name">
                {brand.name}
                <small>{brand.tagline}</small>
              </span>
              <ul>
                {models.map((boat) => (
                  <li key={boat.slug}>
                    <Link href={`/fleet/${boat.slug}`} onClick={closeAll}>
                      <strong>{boat.name}</strong>
                      <small>{boat.eyebrow}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link className="nav-menu-all" href="/fleet" onClick={closeAll}>
            View the whole fleet →
          </Link>
        </NavMenu>

        <NavMenu
          id="configure"
          label="Configurator"
          href="/configure"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          onNavigate={closeAll}
          hoverable={hoverable}
        >
          {fleet.map(({ brand, models }) => {
            const configurable = models.filter((boat) => boat.configuratorModel);
            if (configurable.length === 0) return null;
            return (
              <div className="nav-brand" key={brand.id}>
                <span className="nav-brand-name">
                  {brand.name}
                  <small>Build your specification</small>
                </span>
                <ul>
                  {configurable.map((boat) => (
                    <li key={boat.slug}>
                      <Link
                        href={`/configure?model=${boat.configuratorModel}`}
                        onClick={closeAll}
                      >
                        <strong>{boat.name}</strong>
                        <small>{boat.length}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <Link className="nav-menu-all" href="/configure" onClick={closeAll}>
            Open the configurator →
          </Link>
        </NavMenu>

        <Link href="/ownership" onClick={closeAll}>
          Ownership
        </Link>
        <Link href="/about" onClick={closeAll}>
          Cresta Marine
        </Link>
        <div className="nav-divider" />
        <AccountMenu onNavigate={closeAll} />
        {/* display:contents on the desktop row, so the marks stay direct
            children of the nav flexbox and the header is unchanged; in the
            stacked menu this becomes the footer strip. */}
        <div className="nav-social">
          <a
            className="whatsapp-link"
            href="https://wa.me/201224212222"
            target="_blank"
            rel="noreferrer"
            aria-label="Chat with Cresta Marine on WhatsApp at +20 122 421 2222"
            data-label="WhatsApp"
            onClick={closeAll}
          >
            <span className="whatsapp-icon" aria-hidden="true" />
            <span className="whatsapp-handle">WhatsApp</span>
          </a>
          <a
            className="instagram-link"
            href="https://www.instagram.com/cresta_marine/"
            target="_blank"
            rel="noreferrer"
            aria-label="Cresta Marine on Instagram"
            data-label="Instagram"
            onClick={closeAll}
          >
            <span className="instagram-icon" aria-hidden="true" />
            <span className="instagram-handle">Instagram</span>
          </a>
          <a
            className="facebook-link"
            href="https://www.facebook.com/share/1ax2jcQLpx/?mibextid=wwXIfr"
            target="_blank"
            rel="noreferrer"
            aria-label="Cresta Marine on Facebook"
            data-label="Facebook"
            onClick={closeAll}
          >
            <span className="facebook-icon" aria-hidden="true" />
            <span className="facebook-handle">Facebook</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
