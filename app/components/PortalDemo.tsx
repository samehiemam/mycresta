"use client";

import { useState } from "react";
import Link from "next/link";
import type { AccessUser } from "../../db/users";
import { EmployeeAccountDirectory } from "./EmployeeAccountDirectory";

type Role = "client" | "ambassador" | "employee";
type PortalUser = {
  displayName: string;
  email: string;
};

const leads = [
  {
    name: "Karim Hassan",
    model: "Kumbra 43",
    stage: "Quote requested",
    color: "Anthracite",
    engine: "3 × Mercury V10 400 hp",
    upholstery: "Diamonds Design",
    teak: "Biscuit",
    options: [
      "NSX Ultrawide 15″",
      "Premium upholstery",
      "Hydraulic side balconies",
    ],
    owner: "Mona",
  },
  {
    name: "Nadine Fouad",
    model: "Kumbra 36",
    stage: "Configuration saved",
    color: "Atlantic blue",
    engine: "2 × Mercury V10 350 hp",
    upholstery: "Fossil",
    teak: "Platinum",
    options: ["Special Edition hardtop", "Underwater LED lights", "Bow bimini"],
    owner: "Omar",
  },
  {
    name: "Adam Mansour",
    model: "Kumbra 34",
    stage: "Sea trial",
    color: "Pearl white",
    engine: "2 × Mercury V8 300 hp",
    upholstery: "Grey",
    teak: "Bleached",
    options: ["Autopilot", "Bow thruster", "Premium synthetic teak"],
    owner: "Mona",
  },
];

export function PortalDemo({
  user,
  initialRole,
  canPreviewRoles,
  accountUsers,
}: {
  user: PortalUser;
  initialRole: Role;
  canPreviewRoles: boolean;
  accountUsers: AccessUser[];
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [selected, setSelected] = useState(0);
  const lead = leads[selected];
  const firstName = user.displayName.split(/[\s@]/)[0] || "there";
  const initials = user.displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="portal-shell">
      <aside className="portal-sidebar">
        <img src="/images/cresta-logo-white.png" alt="Cresta Marine" />
        <span className="portal-demo-label">
          {canPreviewRoles ? "My Cresta workspace demo" : "My Cresta"}
        </span>
        <nav>
          {(canPreviewRoles
            ? (["client", "ambassador", "employee"] as Role[])
            : [initialRole]
          ).map((availableRole) => (
            <button
              className={role === availableRole ? "is-active" : ""}
              key={availableRole}
              onClick={() => setRole(availableRole)}
            >
              {availableRole === "client"
                ? "Client view"
                : availableRole === "ambassador"
                  ? "Ambassador view"
                  : "Employee view"}
            </button>
          ))}
        </nav>
        <div className="portal-sidebar-footer">
          <span className="portal-account">
            <strong>Signed in</strong>
            {user.email}
          </span>
          <Link href="/my-cresta">My Cresta home</Link>
          <a href="/signout-with-chatgpt?return_to=%2F">Sign out</a>
        </div>
      </aside>

      <section className="portal-content">
        <header className="portal-topbar">
          <div>
            <span className="eyebrow">My Cresta</span>
            <h1>
              {role === "client"
                ? `Welcome back, ${firstName}`
                : role === "ambassador"
                  ? "Ambassador workspace"
                  : "Sales & client workspace"}
            </h1>
          </div>
          <div className="portal-user">{initials || "CM"}</div>
        </header>

        {role === "client" && (
          <div className="portal-grid">
            <article className="portal-hero-card">
              <div>
                <span className="eyebrow eyebrow--light">
                  Saved configuration
                </span>
                <h2>Kumbra 43</h2>
                <p>Anthracite · Triple Mercury 400 · Full ownership</p>
                <button className="button button--light">Review build</button>
              </div>
              <img
                src="/images/k43-antracite-D4h5PNjW.png"
                alt="Configured Kumbra 43"
              />
            </article>
            <article className="portal-panel">
              <span className="portal-panel-label">Advisor</span>
              <h3>Mona El Sherif</h3>
              <p>Your build is ready for a specification review.</p>
              <button className="text-button">Message Mona →</button>
            </article>
            <article className="portal-panel">
              <span className="portal-panel-label">Next step</span>
              <h3>Specification call</h3>
              <p>Confirm engines, equipment and ownership structure.</p>
              <button className="text-button">Choose a time →</button>
            </article>
            <article className="portal-panel portal-panel--wide">
              <span className="portal-panel-label">Build details</span>
              <dl className="client-build-details">
                <div>
                  <dt>Gelcoat</dt>
                  <dd>{leads[0].color}</dd>
                </div>
                <div>
                  <dt>Upholstery</dt>
                  <dd>{leads[0].upholstery}</dd>
                </div>
                <div>
                  <dt>Teak</dt>
                  <dd>{leads[0].teak}</dd>
                </div>
                <div>
                  <dt>Power</dt>
                  <dd>{leads[0].engine}</dd>
                </div>
              </dl>
              <div className="portal-option-chips">
                {leads[0].options.map((option) => (
                  <span key={option}>{option}</span>
                ))}
              </div>
            </article>
            <article className="portal-panel portal-panel--wide">
              <span className="portal-panel-label">Documents</span>
              <div className="document-row">
                <span>Kumbra 43 brochure</span>
                <span>PDF · Added today</span>
                <button>Open</button>
              </div>
              <div className="document-row">
                <span>Preliminary specification</span>
                <span>PDF · Advisor draft</span>
                <button>Open</button>
              </div>
            </article>
          </div>
        )}

        {role === "ambassador" && (
          <>
            <div className="portal-metrics">
              <article>
                <span>Qualified referrals</span>
                <strong>12</strong>
                <small>4 active this month</small>
              </article>
              <article>
                <span>Configurations saved</span>
                <strong>8</strong>
                <small>Across all three models</small>
              </article>
              <article>
                <span>Sea trials</span>
                <strong>3</strong>
                <small>2 awaiting confirmation</small>
              </article>
            </div>
            <article className="portal-panel portal-panel--table">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Referral pipeline</span>
                  <h2>Your potential clients</h2>
                </div>
                <button className="button button--primary">
                  Add a referral
                </button>
              </div>
              {leads.map((item) => (
                <div className="lead-row" key={item.name}>
                  <strong>{item.name}</strong>
                  <span>{item.model}</span>
                  <span>{item.stage}</span>
                  <button>View configuration →</button>
                </div>
              ))}
            </article>
          </>
        )}

        {role === "employee" && (
          <>
            <div className="employee-layout">
              <article className="portal-panel portal-panel--table">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Live pipeline</span>
                  <h2>Configurations & leads</h2>
                </div>
                <span className="live-indicator">3 new</span>
              </div>
              {leads.map((item, index) => (
                <button
                  className={`lead-row lead-row--button ${
                    selected === index ? "is-selected" : ""
                  }`}
                  key={item.name}
                  onClick={() => setSelected(index)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.model}</span>
                  <span>{item.stage}</span>
                  <span>View →</span>
                </button>
              ))}
              </article>

              <aside className="lead-detail">
              <span className="eyebrow">Configuration CM-0268</span>
              <h2>{lead.name}</h2>
              <p>{lead.stage}</p>
              <img
                src={
                  lead.model === "Kumbra 43"
                    ? "/images/k43-antracite-D4h5PNjW.png"
                    : lead.model === "Kumbra 36"
                      ? "/images/k36-blue-B5XScDbO.png"
                      : "/images/kumbra-34-config-white-clean-i39J1gHM.png"
                }
                alt={lead.model}
              />
              <dl>
                <div>
                  <dt>Model</dt>
                  <dd>{lead.model}</dd>
                </div>
                <div>
                  <dt>Hull</dt>
                  <dd>{lead.color}</dd>
                </div>
                <div>
                  <dt>Power</dt>
                  <dd>{lead.engine}</dd>
                </div>
                <div>
                  <dt>Advisor</dt>
                  <dd>{lead.owner}</dd>
                </div>
              </dl>
              <div className="lead-options">
                <span className="portal-panel-label">Selected equipment</span>
                {lead.options.map((option) => (
                  <span key={option}>{option}</span>
                ))}
              </div>
              <button className="button button--primary button--full">
                Prepare quote
              </button>
              <button className="button button--outline button--full">
                Message lead
              </button>
              </aside>
            </div>
            <EmployeeAccountDirectory initialUsers={accountUsers} />
          </>
        )}
      </section>
    </main>
  );
}
