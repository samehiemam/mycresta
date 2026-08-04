import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Link from "next/link";
import { SiteHeader } from "../../../app/components/SiteHeader";
import { SiteFooter } from "../../../app/components/SiteFooter";
import { PortalNav } from "./PortalLayout";
import { useAuth } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

/** Money arrives as minor units in a named currency and is never converted. */
function money(minor: number, currency: string): string {
  return `${currency} ${(minor / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type Model = {
  slug: string;
  name: string;
  status: string;
  brand: string;
  base_amount: number;
  base_currency: string;
};

type Option = {
  id: string;
  name: string;
  amount_minor: string | number;
  currency: string;
  price_on_request: string | number;
  subgroup: string | null;
};

type Group = {
  id: string;
  name: string;
  selection: "single" | "multi";
  note: string | null;
  options: Option[];
};

type Figures = {
  boat_and_options: number;
  discount?: number;
  shipping: number;
  services: number;
  net?: number;
  vat: number;
  total: number;
};

type Configuration = {
  id: string;
  status: string;
  name: string | null;
  model: { slug: string; name: string };
  items: { kind: string; name: string; amount_minor: string; currency: string; on_request: string }[];
  pricing: {
    currencies: Record<string, Figures>;
    vat_rate: number;
    provisional: boolean;
    unpriced: { name: string }[];
    commission_base?: { currency: string; gross: number; net: number };
  };
  shipping: { set: boolean; amount: number | null; currency: string; display: string };
  discount?: { amount: number; currency: string; reason: string | null };
};

/** Model chooser: the way into the configurator. */
export function StudioModels() {
  useTitle("Boat catalog | My Cresta");
  const { api } = useAuth();
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api<{ models: Model[] }>("studio", "models")
      .then((r) => setModels(r.models))
      .catch((caught: Error) => setError(caught.message));
  }, [api]);

  async function build(slug: string) {
    setBusy(slug);
    setError(null);
    try {
      const created = await api<{ id: string }>("studio", "create", { model: slug });
      navigate(`/portal/studio/${created.id}`);
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(null);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="portal-page">
        <PortalNav />
        <span className="eyebrow">Cresta Studio</span>
        <h1>Build a configuration</h1>
        {error && <p className="form-error">{error}</p>}
        {!models && !error && <p className="portal-loading">Loading the catalog…</p>}

        <div className="studio-model-grid">
          {models?.map((model) => (
            <article className="studio-model-card" key={model.slug}>
              <span className="studio-model-brand">{model.brand}</span>
              <h2>{model.name}</h2>
              <p className="studio-model-price">
                from {money(model.base_amount, model.base_currency)}
              </p>
              {model.status !== "active" && (
                <p className="studio-flag">{model.status.replace("_", " ")}</p>
              )}
              <button
                className="button button--primary button--full"
                type="button"
                disabled={busy === model.slug}
                onClick={() => void build(model.slug)}
              >
                {busy === model.slug ? "Opening…" : "Configure"}
              </button>
            </article>
          ))}
        </div>
        {models?.length === 0 && (
          <p>No models are published yet. Import a price list to seed the catalog.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * The configurator.
 *
 * Every change is sent to the server, which re-prices and re-validates. The
 * browser never computes a total: the figure a customer sees has to be the one
 * the server stands behind.
 */
export function StudioBuilder() {
  const { id = "" } = useParams();
  const { api, user } = useAuth();
  const [config, setConfig] = useState<Configuration | null>(null);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useTitle(config ? `${config.model.name} | My Cresta` : "Configuration | My Cresta");

  const isFounder = user?.role === "admin";

  const load = useCallback(async () => {
    const r = await api<{ configuration: Configuration }>("studio", "config", { id });
    setConfig(r.configuration);
    setChosen(
      new Set(
        r.configuration.items
          .filter((i) => i.kind === "option")
          .map((i) => i.name),
      ),
    );
    const detail = await api<{ groups: Group[] }>("studio", "model", {
      slug: r.configuration.model.slug,
    });
    setGroups(detail.groups);
    // Option ids are what the server wants; map the saved names back to them.
    const byName = new Map<string, string>();
    detail.groups.forEach((g) => g.options.forEach((o) => byName.set(o.name, o.id)));
    setChosen(
      new Set(
        r.configuration.items
          .filter((i) => i.kind === "option")
          .map((i) => byName.get(i.name))
          .filter((v): v is string => Boolean(v)),
      ),
    );
  }, [api, id]);

  useEffect(() => {
    load().catch((caught: Error) => setError(caught.message));
  }, [load]);

  async function commit(next: Set<string>) {
    setSaving(true);
    setProblems([]);
    setError(null);
    try {
      const r = await api<{ configuration: Configuration }>("studio", "set-options", {
        id,
        options: [...next],
      });
      setConfig(r.configuration);
      setChosen(next);
    } catch (caught) {
      const err = caught as Error & { problems?: string[] };
      // A refused combination is not an error to apologise for — it is the
      // rulebook doing its job, so the reasons are shown and the previous
      // selection is kept.
      setProblems(err.problems ?? []);
      if (!err.problems?.length) setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggle(group: Group, optionId: string) {
    const next = new Set(chosen);
    if (group.selection === "single") {
      group.options.forEach((o) => next.delete(o.id));
      if (!chosen.has(optionId)) next.add(optionId);
    } else if (next.has(optionId)) {
      next.delete(optionId);
    } else {
      next.add(optionId);
    }
    void commit(next);
  }

  if (error && !config) {
    return (
      <>
        <SiteHeader />
        <main className="portal-page">
        <PortalNav />
          <h1>Configuration unavailable</h1>
          <p className="form-error">{error}</p>
          <Link className="button button--outline" href="/portal/studio">
            Back to the catalog
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!config || !groups) {
    return (
      <>
        <SiteHeader />
        <main className="portal-page">
        <PortalNav />
          <p className="portal-loading">Loading…</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const locked = config.status === "approved" || config.status === "superseded";

  return (
    <>
      <SiteHeader />
      <main className="studio">
        <div className="studio-options">
          <span className="eyebrow">Cresta Studio</span>
          <h1>{config.model.name}</h1>
          {config.name && <p className="studio-subject">for {config.name}</p>}
          {locked && (
            <p className="studio-locked">
              This configuration has been approved and can no longer be changed.
            </p>
          )}
          {problems.length > 0 && (
            <div className="studio-problems">
              <strong>That combination cannot be built</strong>
              <ul>
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}

          {groups.map((group) => (
            <section className="studio-group" key={group.id}>
              <h2>
                {group.name}
                {group.selection === "single" && (
                  <span className="studio-badge">choose one</span>
                )}
              </h2>
              <div className="studio-option-list">
                {group.options.map((option) => {
                  const onRequest = Number(option.price_on_request) === 1;
                  const active = chosen.has(option.id);
                  return (
                    <button
                      className={`studio-option${active ? " is-chosen" : ""}`}
                      type="button"
                      key={option.id}
                      disabled={saving || locked}
                      aria-pressed={active}
                      onClick={() => toggle(group, option.id)}
                    >
                      <span className="studio-option-name">
                        {option.subgroup && (
                          <span className="studio-option-sub">{option.subgroup}</span>
                        )}
                        {option.name}
                      </span>
                      <span className="studio-option-price">
                        {onRequest
                          ? "On request"
                          : money(Number(option.amount_minor), option.currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="studio-summary">
          <h2>Summary</h2>

          {Object.entries(config.pricing.currencies).map(([currency, figures]) => (
            <div className="studio-total-block" key={currency}>
              <h3>{currency}</h3>
              <dl>
                <div>
                  <dt>Boat and options</dt>
                  <dd>{money(figures.boat_and_options, currency)}</dd>
                </div>
                {/* Only a Founder is ever sent these. */}
                {figures.discount !== undefined && figures.discount > 0 && (
                  <div className="is-discount">
                    <dt>Discount</dt>
                    <dd>−{money(figures.discount, currency)}</dd>
                  </div>
                )}
                <div>
                  <dt>Shipping</dt>
                  <dd>
                    {currency === config.shipping.currency && !config.shipping.set
                      ? config.shipping.display
                      : money(figures.shipping, currency)}
                  </dd>
                </div>
                {figures.services > 0 && (
                  <div>
                    <dt>Services</dt>
                    <dd>{money(figures.services, currency)}</dd>
                  </div>
                )}
                <div>
                  <dt>VAT ({Math.round(config.pricing.vat_rate * 100)}%)</dt>
                  <dd>{money(figures.vat, currency)}</dd>
                </div>
                <div className="is-total">
                  <dt>Total</dt>
                  <dd>{money(figures.total, currency)}</dd>
                </div>
              </dl>
            </div>
          ))}

          {config.pricing.provisional && (
            <p className="studio-provisional">
              Provisional
              {config.pricing.unpriced.length > 0 && (
                <>
                  {" "}
                  — {config.pricing.unpriced.map((u) => u.name).join(", ")}{" "}
                  {config.pricing.unpriced.length === 1 ? "is" : "are"} priced on request
                </>
              )}
              {!config.shipping.set && ". Shipping is not yet set"}.
            </p>
          )}

          {isFounder && config.pricing.commission_base && (
            <p className="studio-commission">
              Commission base{" "}
              {money(
                config.pricing.commission_base.net,
                config.pricing.commission_base.currency,
              )}
            </p>
          )}

          {isFounder && !locked && (
            <FounderControls id={id} config={config} onSaved={setConfig} />
          )}

          <Link className="button button--outline button--full" href="/portal/studio">
            Back to the catalog
          </Link>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}

/** Discount and shipping: Founder only, and refused server-side for anyone else. */
function FounderControls({
  id,
  config,
  onSaved,
}: {
  id: string;
  config: Configuration;
  onSaved: (c: Configuration) => void;
}) {
  const { api } = useAuth();
  const [discount, setDiscount] = useState(String((config.discount?.amount ?? 0) / 100));
  const [reason, setReason] = useState(config.discount?.reason ?? "");
  const [shipping, setShipping] = useState(
    config.shipping.amount === null ? "" : String(config.shipping.amount / 100),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ configuration: Configuration }>("studio", "set-commercials", {
        id,
        discount_minor: Math.round(Number(discount || 0) * 100),
        discount_reason: reason,
        // An empty box means "not yet decided", which is not the same as zero.
        shipping_minor: shipping.trim() === "" ? null : Math.round(Number(shipping) * 100),
      });
      onSaved(r.configuration);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio-founder">
      <h3>Founder controls</h3>
      <label>
        Discount ({config.discount?.currency ?? "EUR"})
        <input
          type="number"
          min="0"
          step="100"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />
      </label>
      <label>
        Reason
        <input
          type="text"
          value={reason}
          placeholder="e.g. Boot Düsseldorf offer"
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <label>
        Shipping ({config.shipping.currency}) — blank means to be confirmed
        <input
          type="number"
          min="0"
          step="100"
          value={shipping}
          onChange={(e) => setShipping(e.target.value)}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button
        className="button button--primary button--full"
        type="button"
        disabled={busy}
        onClick={() => void save()}
      >
        {busy ? "Saving…" : "Save commercials"}
      </button>
    </div>
  );
}
