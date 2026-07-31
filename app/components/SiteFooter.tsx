import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <img src="/images/cresta-logo-white.png" alt="Cresta Marine" />
          <p>Peak Boating Experience</p>
        </div>
        <div>
          <span className="footer-label">Discover</span>
          <Link href="/fleet">The fleet</Link>
          <Link href="/configure">Boat configurator</Link>
          <Link href="/services">Ownership & care</Link>
        </div>
        <div>
          <span className="footer-label">Contact</span>
          <a href="tel:+201007770000">+20 100 777 0000</a>
          <a href="tel:+201001000360">+20 100 100 0360</a>
          <a
            href="https://wa.me/201224212222"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <a href="mailto:info@crestamarine.com">info@crestamarine.com</a>
          <p className="footer-location">
            Abu Tig Marina
            <br />
            El Gouna, Red Sea
          </p>
        </div>
        <div>
          <span className="footer-label">Your account</span>
          <Link href="/my-cresta">My Cresta</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Cresta Marine</span>
        <span>Peak Boating Experience</span>
        <span>Privacy · Terms</span>
      </div>
    </footer>
  );
}
