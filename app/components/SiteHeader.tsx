"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader({
  inverse = false,
  solid = false,
}: {
  inverse?: boolean;
  solid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={[
        "site-header",
        inverse ? "site-header--inverse" : "",
        solid ? "site-header--solid" : "",
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
        <Link href="/fleet">Fleet</Link>
        <Link href="/configure">Configurator</Link>
        <Link href="/services">Ownership</Link>
        <Link href="/about">Cresta Marine</Link>
        <Link href="/my-cresta">My Cresta</Link>
        <a
          className="whatsapp-link"
          href="https://wa.me/201224212222"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Cresta Marine on WhatsApp at +20 122 421 2222"
        >
          <img
            className="whatsapp-icon"
            src="/images/whatsapp-mark-menu.svg"
            alt=""
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
        >
          <span className="instagram-icon" aria-hidden="true" />
          <span className="instagram-handle">Instagram</span>
        </a>
      </nav>
    </header>
  );
}
