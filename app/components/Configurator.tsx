"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  EquipmentOption,
  finishLabels,
  finishOptions,
  modelOptions,
  ModelKey,
  visualColour,
} from "../configurator-data";

type FinishKey = keyof typeof finishOptions;

/**
 * Hull preview that dissolves between images when the model or gelcoat colour
 * changes: the previous frame stays stacked on top and fades out.
 */
function HullVisual({ src, alt }: { src: string; alt: string }) {
  const [previous, setPrevious] = useState<string | null>(null);
  const currentSrc = useRef(src);

  useEffect(() => {
    if (currentSrc.current === src) return;
    const outgoing = currentSrc.current;
    currentSrc.current = src;
    setPrevious(outgoing);
    const timer = window.setTimeout(() => setPrevious(null), 600);
    return () => window.clearTimeout(timer);
  }, [src]);

  return (
    <div className="boat-visual">
      {previous && (
        <img
          key={previous}
          className="cresta-hull cresta-hull--out"
          src={previous}
          alt=""
          aria-hidden="true"
        />
      )}
      <img key={src} className="cresta-hull cresta-hull--in" src={src} alt={alt} />
    </div>
  );
}

/**
 * Top-down deck view. Until the factory top renders exist, the reserved space
 * shows the chosen interior materials so it stays useful rather than empty.
 */
function DeckPreview({
  image,
  alt,
  materials,
}: {
  image?: string;
  alt: string;
  materials: { label: string; name: string; tone: string }[];
}) {
  return (
    <div className="deck-preview">
      {image ? (
        <img className="deck-preview-image" src={image} alt={alt} />
      ) : (
        <div className="deck-preview-materials">
          <div className="deck-preview-heading">
            <span className="eyebrow eyebrow--light">Deck &amp; interior</span>
            <small>Top view render coming soon</small>
          </div>
          <ul>
            {materials.map((material) => (
              <li key={material.label}>
                <span
                  className="deck-swatch"
                  style={{ background: material.tone }}
                  aria-hidden="true"
                />
                <span className="deck-swatch-copy">
                  <strong>{material.name}</strong>
                  <small>{material.label}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const initialFinishes: Record<FinishKey, string> = {
  gelcoat: "white",
  vinyl: "white",
  upholstery: "grey",
  furniture: "wenge",
  flooring: "chene-topia",
  countertop: "multiplis-nature",
  teak: "bleached",
};

export function Configurator() {
  const searchParams = useSearchParams();
  const requestedModel = searchParams.get("model");
  const initialModel: ModelKey =
    requestedModel === "34" || requestedModel === "36" || requestedModel === "43"
      ? requestedModel
      : "43";
  const [model, setModel] = useState<ModelKey>(initialModel);
  const [engineId, setEngineId] = useState(
    modelOptions[initialModel].engines[0].id,
  );
  const [finishes, setFinishes] =
    useState<Record<FinishKey, string>>(initialFinishes);
  const [ownership, setOwnership] = useState("Full ownership");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Control & manoeuvring");
  const [propulsionTab, setPropulsionTab] = useState<
    EngineOption["propulsion"] | null
  >(null);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [showIncludedEquipment, setShowIncludedEquipment] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const current = modelOptions[model];
  const engine =
    current.engines.find((item) => item.id === engineId) ?? current.engines[0];

  const categories = useMemo(
    () => [...new Set(current.equipment.map((item) => item.category))],
    [current.equipment],
  );

  // Engines are grouped by propulsion: it is the choice that actually changes
  // the boat (and gates equipment), and it keeps the list short per view.
  const propulsions = useMemo(
    () => [...new Set(current.engines.map((item) => item.propulsion))],
    [current.engines],
  );
  // Defaults to the selected engine's group, and falls back to it whenever the
  // model changes and the previous group no longer exists.
  const activePropulsion =
    propulsionTab && propulsions.includes(propulsionTab)
      ? propulsionTab
      : engine.propulsion;
  const visibleEngines = current.engines.filter(
    (item) => item.propulsion === activePropulsion,
  );

  const visibleEquipment = useMemo(() => {
    const search = equipmentSearch.trim().toLowerCase();
    if (search) {
      return current.equipment.filter((item) =>
        `${item.label} ${item.category} ${item.condition ?? ""}`
          .toLowerCase()
          .includes(search),
      );
    }
    return current.equipment.filter((item) => item.category === activeCategory);
  }, [activeCategory, current.equipment, equipmentSearch]);

  const selectedOptions = current.equipment.filter((item) =>
    selectedEquipment.includes(item.id),
  );

  function compatibilityReason(item: EquipmentOption) {
    if (item.engineFamily && item.engineFamily !== engine.family) {
      return `Available with ${item.engineFamily} engines.`;
    }
    if (item.unavailableWithPropulsion?.includes(engine.propulsion)) {
      return `Not available with ${engine.propulsion.toLowerCase()} propulsion.`;
    }
    return null;
  }

  function selectModel(next: ModelKey) {
    setModel(next);
    setEngineId(modelOptions[next].engines[0].id);
    setSelectedEquipment([]);
    setActiveCategory("Control & manoeuvring");
    setEquipmentSearch("");
    setShowIncludedEquipment(false);
    setPropulsionTab(null);
  }

  function selectEngine(nextEngineId: string) {
    const nextEngine = current.engines.find((item) => item.id === nextEngineId);
    if (!nextEngine) return;
    setEngineId(nextEngineId);
    setSelectedEquipment((items) =>
      items.filter((id) => {
        const item = current.equipment.find((option) => option.id === id);
        if (!item) return false;
        if (item.engineFamily && item.engineFamily !== nextEngine.family) return false;
        return !item.unavailableWithPropulsion?.includes(nextEngine.propulsion);
      }),
    );
  }

  function toggleEquipment(item: EquipmentOption) {
    if (compatibilityReason(item)) return;
    setSelectedEquipment((items) => {
      if (items.includes(item.id)) {
        return items.filter((value) => value !== item.id);
      }

      const withoutExclusivePeer = item.exclusiveGroup
        ? items.filter((id) => {
            const selected = current.equipment.find((option) => option.id === id);
            return selected?.exclusiveGroup !== item.exclusiveGroup;
          })
        : items;

      return [...withoutExclusivePeer, item.id];
    });
  }

  const unresolvedConditions = selectedOptions.filter(
    (item) =>
      item.requiresAny &&
      !item.requiresAny.some((requiredId) => selectedEquipment.includes(requiredId)),
  );

  const finishSummary = Object.fromEntries(
    (Object.keys(finishOptions) as FinishKey[]).map((key) => [
      finishLabels[key],
      finishOptions[key].find((item) => item.id === finishes[key])?.label ??
        finishes[key],
    ]),
  );

  const privateEstimate =
    current.basePrice +
    engine.price +
    selectedOptions.reduce(
      (total, item) => total + (typeof item.price === "number" ? item.price : 0),
      0,
    );

  const summary = {
    model: current.name,
    engine: engine.label,
    propulsion: engine.propulsion,
    ownership,
    finishes: finishSummary,
    includedEquipment: current.includedEquipment,
    equipment: selectedOptions.map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      condition: item.condition ?? null,
      quotedPrice: item.price,
    })),
    conditionsToConfirm: unresolvedConditions.map((item) => item.condition),
    pricing: {
      currency: "EUR",
      internalEstimateExVat: privateEstimate,
      visibleToClient: false,
      note: "Final quotation and all taxes are confirmed by Cresta Marine.",
    },
    source: `Official Kumbra ${model} price list`,
  };

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");

    try {
      const response = await fetch("/submit.php", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "lead",
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          provider: "Direct quote request",
          configuration: summary,
        }),
      });
      if (!response.ok) throw new Error("Unable to save");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const gelcoat =
    finishOptions.gelcoat.find((item) => item.id === finishes.gelcoat)?.label ??
    "White";
  const visual = visualColour(finishes.gelcoat);

  // Materials shown in the deck panel while the top-view render is pending.
  const deckMaterials = (
    ["upholstery", "flooring", "teak", "furniture"] as FinishKey[]
  ).map((key) => {
    const option = finishOptions[key].find((item) => item.id === finishes[key]);
    return {
      label: finishLabels[key],
      name: option?.label ?? finishes[key],
      tone: option?.tone ?? "transparent",
    };
  });

  return (
    <>
      <main className="configurator">
        <section className="configurator-stage">
          <div className="configurator-stage-copy">
            <span className="eyebrow eyebrow--light">Live configuration</span>
            <h1>{current.name}</h1>
            <p>{current.spec}</p>
          </div>
          <HullVisual
            src={current.images[visual]}
            alt={`${current.name} configured in ${gelcoat}`}
          />
          <DeckPreview
            image={current.topImages?.[visual]}
            alt={`${current.name} deck seen from above`}
            materials={deckMaterials}
          />
          <div className="config-stage-footer">
            <span>{gelcoat} gelcoat · {engine.propulsion}</span>
            <span>Finish visual is indicative; your advisor confirms samples.</span>
          </div>
        </section>

        <section className="configurator-controls">
          <div className="configurator-heading">
            <span className="eyebrow">Cresta Studio</span>
            <h2>Make it yours.</h2>
            <p>
              Configure from the official Kumbra specification. Prices stay
              private and Cresta confirms your final build and quotation.
            </p>
          </div>

          <fieldset className="config-group">
            <legend>01 · Model</legend>
            <div className="segmented segmented--three">
              {(Object.keys(modelOptions) as ModelKey[]).map((key) => (
                <button
                  type="button"
                  className={model === key ? "is-selected" : ""}
                  onClick={() => selectModel(key)}
                  key={key}
                >
                  <strong>Kumbra {key}</strong>
                  <span>{modelOptions[key].spec.split(" · ")[0]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="config-group">
            <legend>02 · Included as standard</legend>
            <div className="included-equipment-card">
              <div className="included-equipment-heading">
                <div>
                  <span>Factory specification</span>
                  <strong>{current.name} standard equipment</strong>
                </div>
                <span>{current.includedEquipment.length} included features</span>
              </div>
              <ul className="included-equipment-grid">
                {(showIncludedEquipment
                  ? current.includedEquipment
                  : current.includedEquipment.slice(0, 8)
                ).map((item) => (
                  <li key={item}>
                    <span aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                className="included-equipment-toggle"
                type="button"
                aria-expanded={showIncludedEquipment}
                onClick={() => setShowIncludedEquipment((value) => !value)}
              >
                {showIncludedEquipment
                  ? "Show compact list"
                  : `View all ${current.includedEquipment.length} included features`}
                <span aria-hidden="true">
                  {showIncludedEquipment ? "−" : "+"}
                </span>
              </button>
            </div>
          </fieldset>

          <fieldset className="config-group">
            <legend>03 · Power</legend>
            <p className="config-group-intro">
              Choose the propulsion first — it decides how the boat is driven
              and which equipment is available. One engine package is selected.
            </p>

            <div className="category-tabs" aria-label="Propulsion type">
              {propulsions.map((propulsion) => {
                const count = current.engines.filter(
                  (item) => item.propulsion === propulsion,
                ).length;
                return (
                  <button
                    type="button"
                    key={propulsion}
                    className={activePropulsion === propulsion ? "is-selected" : ""}
                    aria-pressed={activePropulsion === propulsion}
                    onClick={() => setPropulsionTab(propulsion)}
                  >
                    {propulsion}
                    <span className="tab-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="engine-list"
              role="radiogroup"
              aria-label={`${activePropulsion} engine packages`}
            >
              {visibleEngines.map((item) => (
                <label key={item.id}>
                  <input
                    type="radio"
                    name="engine"
                    checked={engine.id === item.id}
                    onChange={() => selectEngine(item.id)}
                  />
                  <span>
                    <strong>
                      {/* the propulsion is already the group heading */}
                      {item.label.split(" — ")[0]}
                    </strong>
                    <small>{item.family}</small>
                  </span>
                </label>
              ))}
            </div>

            <p className="engine-selected-note">
              <span>Selected</span>
              <strong>{engine.label.split(" — ")[0]}</strong>
              <small>{engine.propulsion}</small>
            </p>
          </fieldset>

          <fieldset className="config-group">
            <legend>04 · Colours & materials</legend>
            <p className="config-group-intro">
              Every finish below comes from the Kumbra materials guide and is
              available across all three models.
            </p>
            <div className="finish-groups">
              {(Object.keys(finishOptions) as FinishKey[]).map((key) => (
                <div className="finish-group" key={key}>
                  <div className="finish-group-heading">
                    <strong>{finishLabels[key]}</strong>
                    <span>
                      {finishOptions[key].find((item) => item.id === finishes[key])
                        ?.label}
                    </span>
                  </div>
                  <div className="finish-options">
                    {finishOptions[key].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={finishes[key] === item.id ? "is-selected" : ""}
                        onClick={() =>
                          setFinishes((currentFinishes) => ({
                            ...currentFinishes,
                            [key]: item.id,
                          }))
                        }
                        title={`${item.label}${item.note ? ` — ${item.note}` : ""}`}
                        aria-label={`Select ${item.label} for ${finishLabels[key]}`}
                      >
                        <span
                          className="material-swatch"
                          style={{ background: item.tone }}
                          aria-hidden="true"
                        />
                        <span className="material-name">{item.label}</span>
                        {item.note && <small>{item.note}</small>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="config-group">
            <legend>05 · Optional equipment</legend>
            <div className="equipment-toolbar">
              <label>
                <span className="sr-only">Search equipment</span>
                <input
                  type="search"
                  value={equipmentSearch}
                  onChange={(event) => setEquipmentSearch(event.target.value)}
                  placeholder="Search equipment"
                />
              </label>
              <span>{selectedEquipment.length} selected</span>
            </div>

            {!equipmentSearch && (
              <div className="category-tabs" aria-label="Equipment categories">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={activeCategory === category ? "is-selected" : ""}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {equipmentSearch && (
              <p className="search-result-count">
                {visibleEquipment.length} matching option
                {visibleEquipment.length === 1 ? "" : "s"}
              </p>
            )}

            <div className="official-equipment-list">
              {visibleEquipment.map((item) => {
                const unavailable = compatibilityReason(item);
                const checked = selectedEquipment.includes(item.id);
                const needsRequirement =
                  checked &&
                  item.requiresAny &&
                  !item.requiresAny.some((id) => selectedEquipment.includes(id));

                return (
                  <label
                    key={item.id}
                    className={[
                      checked ? "is-selected" : "",
                      unavailable ? "is-disabled" : "",
                      needsRequirement ? "needs-attention" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={Boolean(unavailable)}
                      onChange={() => toggleEquipment(item)}
                    />
                    <span className="option-check" aria-hidden="true" />
                    <span className="official-option-copy">
                      {equipmentSearch && <small>{item.category}</small>}
                      <strong>{item.label}</strong>
                      {(unavailable || item.condition) && (
                        <span className="condition-note">
                          {unavailable ?? item.condition}
                        </span>
                      )}
                      {item.exclusiveGroup && !unavailable && (
                        <span className="condition-tag">Choose one</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="config-group">
            <legend>06 · Ownership</legend>
            <select
              value={ownership}
              onChange={(event) => setOwnership(event.target.value)}
              aria-label="Ownership model"
            >
              <option>Full ownership</option>
              <option>1/2 co-ownership</option>
              <option>1/4 co-ownership</option>
              <option>1/5 co-ownership</option>
            </select>
          </fieldset>

          <div className="configuration-summary">
            <div className="configuration-summary-heading">
              <div>
                <span className="eyebrow">Your configuration</span>
                <strong>{summary.model}</strong>
              </div>
              <span>{selectedEquipment.length} options</span>
            </div>
            <div className="summary-row">
              <span>{gelcoat} · {finishSummary.Upholstery}</span>
              <span>{summary.engine}</span>
              <span>{summary.ownership}</span>
            </div>
            {unresolvedConditions.length > 0 && (
              <div className="summary-attention">
                {unresolvedConditions.length} selected option
                {unresolvedConditions.length === 1 ? "" : "s"} need
                {unresolvedConditions.length === 1 ? "s" : ""} a power-system
                choice.
              </div>
            )}
            <button
              className="button button--primary button--full"
              type="button"
              onClick={() => setDialog(true)}
            >
              Save configuration & request a quote
            </button>
            <small>
              No price is shown online. Internal price-list values and special
              conditions are sent securely to your Cresta advisor.
            </small>
          </div>
        </section>
      </main>

      {dialog && (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-dialog-title"
          >
            <button
              type="button"
              className="dialog-close"
              onClick={() => {
                setDialog(false);
                setStatus("idle");
              }}
              aria-label="Close"
            >
              ×
            </button>

            {status === "sent" ? (
              <div className="success-state">
                <span className="success-mark">✓</span>
                <h2>Configuration received</h2>
                <p>
                  Your Cresta advisor can now review the complete build,
                  conditions and private price-list details.
                </p>
                <a
                  className="button button--primary"
                  href={`https://wa.me/201224212222?text=${encodeURIComponent(
                    `Hello Cresta Marine — I have configured a ${summary.model} and would like to discuss my quote.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Continue on WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={submitLead} className="profile-form">
                <span className="eyebrow">Save your build</span>
                <h2 id="auth-dialog-title">Request your private quote</h2>
                <p>
                  Enter your details once. Cresta will save this configuration
                  to your lead record and prepare your tailored quote.
                </p>
                <label>
                  Name
                  <input name="name" required autoComplete="name" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required autoComplete="email" />
                </label>
                <label>
                  Mobile / WhatsApp
                  <input name="phone" required autoComplete="tel" />
                </label>
                <label className="consent-row">
                  <input name="consent" type="checkbox" required />
                  <span>
                    I agree that Cresta Marine may contact me about this
                    configuration.
                  </span>
                </label>
                <button
                  className="button button--primary button--full"
                  type="submit"
                  disabled={status === "sending"}
                >
                  {status === "sending"
                    ? "Saving configuration…"
                    : "Save & request my quote"}
                </button>
                {status === "error" && (
                  <p className="form-error">
                    The preview could not save this lead. Please continue on
                    WhatsApp.
                  </p>
                )}
                <a className="profile-portal-link" href="/my-cresta">
                  Already have an account? My Cresta →
                </a>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
