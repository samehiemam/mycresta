import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeatureCarousel } from "../../components/FeatureCarousel";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { boats, getBoat } from "../../data";

export function generateStaticParams() {
  return boats.map((boat) => ({ slug: boat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const boat = getBoat(slug);
  return {
    title: boat ? `${boat.name} | Cresta Marine` : "Cresta Marine fleet",
    description: boat
      ? `${boat.description} Explore layouts, equipment highlights and full technical specifications.`
      : undefined,
  };
}

export default async function BoatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const boat = getBoat(slug);
  if (!boat) notFound();

  const technicalGroups = [
    { title: "Dimensions", specs: boat.dimensions },
    { title: "Propulsion & performance", specs: boat.propulsion },
    { title: "Capacity & tanks", specs: boat.onboard },
  ];

  return (
    <>
      <div className="boat-page-header">
        <SiteHeader inverse />
      </div>
      <main>
        <section className="boat-hero boat-hero--studio">
          <div className="boat-hero-grid">
            <div className="boat-hero-copy">
              <span className="eyebrow eyebrow--light">{boat.eyebrow}</span>
              <h1>{boat.name}</h1>
              <p>{boat.description}</p>
              <div className="button-row">
                <Link
                  className="button button--light button--configure"
                  href={`/configure?model=${boat.slug.replace("kumbra-", "")}`}
                >
                  Configure your boat
                </Link>
                <a
                  className="button button--ghost-light"
                  href={boat.catalogue}
                  download
                >
                  Download catalogue
                </a>
              </div>
            </div>
            <div className="boat-hero-visual">
              <span aria-hidden="true">
                {boat.name.replace("Kumbra ", "")}
              </span>
              <img
                src={boat.profile}
                alt={`${boat.name} white side profile`}
              />
            </div>
          </div>
          <div className="boat-hero-signature" aria-label="Kumbra yacht origin">
            <span>Born in Barcelona</span>
            <span>Presented in Egypt by Cresta Marine</span>
          </div>
        </section>

        <section className="boat-specs" aria-label={`${boat.name} key specifications`}>
          {[
            ["Overall length", boat.length],
            ["Beam", boat.beam],
            ["Capacity", boat.capacity],
            ["Maximum power", boat.power],
            ["Maximum speed", boat.speed],
            ["Accommodation", boat.cabins],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="boat-story">
          <div>
            <span className="eyebrow">Model overview</span>
            <h2>{boat.storyTitle}</h2>
          </div>
          <p>{boat.story}</p>
        </section>

        <section className="model-highlights">
          <div className="model-section-heading">
            <span className="eyebrow">Design &amp; comfort</span>
            <h2>Made for a full day on the water.</h2>
          </div>
          <div className="model-feature-grid">
            {boat.highlights.map((feature, index) => (
              <article key={feature.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <FeatureCarousel boatName={boat.name} items={boat.gallery} />

        <section className="boat-gallery">
          <img src={boat.secondary} alt={`${boat.name} profile`} />
          <div className="gallery-caption">
            <span className="eyebrow">Built in Spain</span>
            <h2>Bold lines. Clear purpose.</h2>
            <p>
              Final colours, engines, upholstery and equipment are selected in
              the Cresta Studio configurator.
            </p>
            <Link
              className="text-link"
              href={`/configure?model=${boat.slug.replace("kumbra-", "")}`}
            >
              Explore the available specification →
            </Link>
          </div>
        </section>

        <section className="model-interior">
          <div className="model-section-heading model-section-heading--light">
            <span className="eyebrow eyebrow--light">Below deck</span>
            <h2>{boat.interiorTitle}</h2>
            <p>{boat.interiorIntro}</p>
          </div>
          <div className="model-interior-grid">
            {boat.interiorFeatures.map((feature) => (
              <article key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="model-performance">
          <div className="model-section-heading">
            <span className="eyebrow">Performance</span>
            <h2>Confidence from rest to cruise.</h2>
          </div>
          <div className="model-performance-grid">
            {boat.performanceFeatures.map((feature) => (
              <article key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="model-layouts">
          <div className="model-layouts-heading">
            <div>
              <span className="eyebrow">Plans &amp; arrangements</span>
              <h2>See how every space connects.</h2>
            </div>
            <p>{boat.layoutNote}</p>
          </div>
          <div
            className={`model-layout-grid ${
              boat.layouts.length === 1 ? "model-layout-grid--single" : ""
            }`}
          >
            {boat.layouts.map((layout) => (
              <figure key={layout.title}>
                <a
                  className="model-layout-image"
                  href={layout.image}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open the ${layout.title.toLowerCase()} full size`}
                >
                  <img src={layout.image} alt={layout.alt} loading="lazy" />
                  <span>Open full size ↗</span>
                </a>
                <figcaption>
                  <strong>{layout.title}</strong>
                  <span>{layout.description}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="model-technical">
          <div className="model-technical-heading">
            <div>
              <span className="eyebrow eyebrow--light">
                Complete technical data
              </span>
              <h2>{boat.name} specifications</h2>
            </div>
            <a className="button button--light" href={boat.catalogue} download>
              Download official catalogue
            </a>
          </div>
          <div className="model-technical-grid">
            {technicalGroups.map((group) => (
              <article key={group.title}>
                <h3>{group.title}</h3>
                <dl>
                  {group.specs.map((spec) => (
                    <div key={spec.label}>
                      <dt>{spec.label}</dt>
                      <dd>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <p className="model-source-note">
            Published figures are based on the supplied Kumbra catalogue and may
            vary with propulsion, load and optional equipment. Final
            specification is confirmed in the sales contract.
          </p>
        </section>

        {boat.video && (
          <section className="boat-film">
            <div>
              <span className="eyebrow eyebrow--light">In motion</span>
              <h2>Discover the {boat.name}</h2>
            </div>
            <video controls playsInline preload="metadata" poster={boat.hero}>
              <source src={boat.video} type="video/mp4" />
            </video>
          </section>
        )}

        <section className="model-cta">
          <div>
            <span className="eyebrow">Your next boat starts here</span>
            <h2>Build the specification. We will prepare the quote.</h2>
          </div>
          <Link
            className="button button--primary button--configure"
            href={`/configure?model=${boat.slug.replace("kumbra-", "")}`}
          >
            Configure your boat
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
