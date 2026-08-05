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
      >
        <span
          className={`account-avatar${user ? " has-initials" : ""}`}
          aria-hidden="true"
        >
          {user ? (initials || "?") : ""}
        </span>
        {user && <span className="account-trigger-name">{user.fullName.split(" ")[0]}</span>}
      </button>

      <div className="account-panel" role="menu">
        {user ? (
          <>
            <div className="account-who">
              <strong>{user.fullName}</strong>
              <small>{user.email}</small>
            </div>
            <Link
              href={roleHome[user.role]}
              role="menuitem"
              onClick={() => { setOpen(false); onNavigate(); }}
            >
              My Cresta
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
              Logout
            </button>
          </>
        ) : (
          <>
            <div className="quick-login-form">
              {error && <div className="login-error">{error}</div>}
              <input
                type="email"
                placeholder="Email address"
                className="login-input"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={logging}
              />
              <input
                type="password"
                placeholder="Password"
                className="login-input"
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={logging}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && email && password && !logging) {
                    handleLogin();
                  }
                }}
              />
              <button
                className="login-submit"
                type="button"
                onClick={handleLogin}
                disabled={logging || !email || !password}
              >
                {logging ? "Signing in..." : "Sign In"}
              </button>
            </div>
            <div className="account-panel-divider" />
            <div className="account-panel-footer">
              <Link
                href="/my-cresta"
                className="footer-link my-cresta-link"
                onClick={() => { setOpen(false); onNavigate(); }}
              >
                My Cresta
              </Link>
              <Link
                href="/my-cresta"
                className="footer-link register-link"
                onClick={() => { setOpen(false); onNavigate(); }}
              >
                Register
              </Link>
            </div>
          </>
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
        <a
          className="whatsapp-link"
          href="https://wa.me/201224212222"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Cresta Marine on WhatsApp at +20 122 421 2222"
          data-label="WhatsApp"
          onClick={closeAll}
        >
          <img
            src="/images/whatsapp-icon.svg"
            alt=""
            className="whatsapp-icon"
            aria-hidden="true"
          />
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
          <img
            src="/images/instagram-icon.svg"
            alt=""
            className="instagram-icon"
            aria-hidden="true"
          />
          <span className="instagram-handle">Instagram</span>
        </a>
      </nav>
    </header>
  );
}
