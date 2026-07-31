import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { boats } from "../data";

export const metadata: Metadata = {
  title: "Kumbra fleet | Cresta Marine",
  description:
    "Explore Kumbra 34, Kumbra 36 and Kumbra 43 with Cresta Marine in El Gouna.",
};

export default function FleetPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-intro">
          <span className="eyebrow">Kumbra Yachts · Egypt</span>
          <h1>Three ways to own the sea.</h1>
          <p>
            Spanish-built walkaround yachts selected for the Red Sea. Compare
            the range, then configure the boat around the way you use it.
          </p>
        </section>
        <section className="fleet-list">
          {boats.map((boat, index) => (
            <article className="fleet-row" key={boat.slug}>
              <div className="fleet-row-image fleet-row-image--studio">
                <span className="fleet-row-watermark" aria-hidden="true">
                  {boat.name.replace("Kumbra ", "")}
                </span>
                <img
                  src={boat.profile}
                  alt={`${boat.name} white side profile`}
                />
                <span className="fleet-row-index">0{index + 1}</span>
              </div>
              <div className="fleet-row-copy">
                <span className="eyebrow">{boat.eyebrow}</span>
                <h2>{boat.name}</h2>
                <p>{boat.description}</p>
                <div className="fleet-spec-line">
                  <span>{boat.length}</span>
                  <span>{boat.capacity}</span>
                  <span>{boat.power}</span>
                  <span>{boat.speed}</span>
                </div>
                <div className="button-row">
                  <Link className="button button--primary" href={`/fleet/${boat.slug}`}>
                    Explore {boat.name}
                  </Link>
                  <Link
                    className="button button--outline button--configure"
                    href={`/configure?model=${boat.slug.replace("kumbra-", "")}`}
                  >
                    Configure your boat
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
        <section className="future-brands">
          <span className="eyebrow eyebrow--light">Built to expand</span>
          <h2>Kumbra leads the fleet today. The platform is ready for more.</h2>
          <p>
            Cresta Marine is building a carefully selected multi-brand portfolio
            for Red Sea and Mediterranean owners.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
