import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { Configurator, type SavedSelection } from "../../../app/components/Configurator";
import type { ModelKey } from "../../../app/configurator-data";
import { useAuth } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

type BuildRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  model_key: string;
  status: string;
  estimate_minor: string | number;
  currency: string;
  created_at: string;
};

const eur = (minor: number, currency: string) =>
  `${currency} ${(minor / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

/** Configurations customers built on the public site, waiting to be picked up. */
export function Builds() {
  useTitle("Client configurations | My Cresta");
  const { api } = useAuth();
  const [builds, setBuilds] = useState<BuildRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ builds: BuildRow[] }>("studio", "builds")
      .then((r) => setBuilds(r.builds))
      .catch((caught: Error) => setError(caught.message));
  }, [api]);

  return (
    <>
      <SiteHeader />
      <main className="portal-page">
        <span className="eyebrow">My Cresta</span>
        <h1>Client configurations</h1>
        <p className="portal-intro">
          Boats customers configured on the public website. Prices here are the
          price-list figures; the customer never saw them.
        </p>
        {error && <p className="form-error">{error}</p>}
        {!builds && !error && <p className="portal-loading">Loading…</p>}
        {builds?.length === 0 && <p>No client configurations yet.</p>}

        {builds && builds.length > 0 && (
          <table className="builds-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Customer</th>
                <th>Model</th>
                <th>Boat &amp; options</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {builds.map((b) => (
                <tr key={b.id}>
                  <td>{new Date(b.created_at.replace(" ", "T") + "Z").toLocaleDateString()}</td>
                  <td>
                    {b.full_name ?? "—"}
                    {b.email && <small>{b.email}</small>}
                  </td>
                  <td>Kumbra {b.model_key}</td>
                  <td className="is-figure">{eur(Number(b.estimate_minor), b.currency)}</td>
                  <td>
                    <span className={`build-status is-${b.status}`}>{b.status}</span>
                  </td>
                  <td>
                    <Link className="button button--outline" href={`/portal/builds/${b.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * One client's build, reopened.
 *
 * Rendered by the same component the customer used, so staff see the boat they
 * saw — images, colours, materials and all — with the price list showing.
 */
export function BuildDetail() {
  const { id = "" } = useParams();
  const { api } = useAuth();
  const [selection, setSelection] = useState<SavedSelection | null>(null);
  const [meta, setMeta] = useState<BuildRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useTitle(meta ? `Kumbra ${meta.model_key} — client build | My Cresta` : "Client build");

  useEffect(() => {
    type Payload = BuildRow & {
      engine_id: string;
      ownership: string | null;
      diamond_stitching: boolean;
      finishes: Record<string, string>;
      equipment: string[];
    };
    api<{ build: Payload }>("studio", "build", { id })
      .then((r) => {
        setMeta(r.build);
        setSelection({
          model: r.build.model_key as ModelKey,
          engineId: r.build.engine_id,
          finishes: r.build.finishes,
          equipment: r.build.equipment,
          diamondStitching: r.build.diamond_stitching,
          ownership: r.build.ownership ?? "Full ownership",
        });
      })
      .catch((caught: Error) => setError(caught.message));
  }, [api, id]);

  if (error) {
    return (
      <>
        <SiteHeader />
        <main className="portal-page">
          <h1>Configuration unavailable</h1>
          <p className="form-error">{error}</p>
          <Link className="button button--outline" href="/portal/builds">
            Back to client configurations
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!selection || !meta) {
    return (
      <>
        <SiteHeader />
        <main className="portal-page">
          <p className="portal-loading">Loading the configuration…</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <div className="build-banner">
        <div>
          <strong>{meta.full_name ?? "Website visitor"}</strong>
          {meta.email && <span>{meta.email}</span>}
          {meta.phone && <span>{meta.phone}</span>}
        </div>
        <div className="build-banner-right">
          <span>Built on the public site — prices below were never shown to them</span>
          <Link className="button button--outline" href="/portal/builds">
            All client configurations
          </Link>
        </div>
      </div>
      {/* The customer's own view, replayed, with the price list revealed. */}
      <Configurator prices readOnly initial={selection} />
    </>
  );
}
