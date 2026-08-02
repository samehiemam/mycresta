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
 * Who you are, and the way out.
 *
 * On a wide screen it is an avatar that opens on click; inside the mobile menu
 * the same markup lays out as a labelled block, because a bare icon in a
 * vertical list gives no clue what it does.
 */
function AccountMenu({ onNavigate }: { onNavigate: () => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
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

  if (!user) return null;

  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={`account-menu${open ? " is-open" : ""}`} ref={wrap}>
      <button
        className="account-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="account-avatar" aria-hidden="true">{initials || "?"}</span>
        <span className="account-trigger-name">{user.fullName.split(" ")[0]}</span>
      </button>

      <div className="account-panel" role="menu">
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
          Sign out
        </button>
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

        <Link href="/services" onClick={closeAll}>
          Ownership
        </Link>
        <Link href="/about" onClick={closeAll}>
          Cresta Marine
        </Link>
        {/* Signed out this is just the marketing page; signed in it becomes
            the way back to your own area, and the way out. */}
        {user ? (
          <AccountMenu onNavigate={closeAll} />
        ) : (
          <Link href="/my-cresta" onClick={closeAll}>
            My Cresta
          </Link>
        )}
        <a
          className="whatsapp-link"
          href="https://wa.me/201224212222"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Cresta Marine on WhatsApp at +20 122 421 2222"
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
        >
          <span className="instagram-icon" aria-hidden="true" />
          <span className="instagram-handle">Instagram</span>
        </a>
      </nav>
    </header>
  );
}
