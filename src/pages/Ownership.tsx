import Link from "next/link";
import { SiteFooter } from "../../app/components/SiteFooter";
import { SiteHeader } from "../../app/components/SiteHeader";
import { useTitle } from "../lib/useTitle";

/**
 * Ownership — full and shared.
 *
 * Was /services, which said less than the navigation link pointing at it: the
 * header has always called this "Ownership". The URL now agrees with the word
 * everybody was already using, and /services 301s here.
 *
 * Built from a deliberately different set of layout classes to /yacht-finance.
 * The two pages were near-identical in structure — page-intro, service-grid,
 * financing block, portal strip — because the finance page was cut from this
 * one. Sharing a skeleton made them read as the same page with the nouns
 * swapped. This one uses the wide intro, the two-column story, the bordered
 * values grid and the dark gradient panel, none of which appear there.
 *
 * The share sizes are the ones the configurator actually offers — a half, a
 * quarter and a fifth. Nothing here invents a rotation rule, a booking window
 * or a cost split, because none is defined yet; the page describes the
 * principles it works to and leaves the mechanics to the conversation.
 *
 * Financing is framed as one of three ways to own rather than a footnote. It
 * had been a single clause in the closing paragraph of a 555-word page, which
 * is indistinguishable from not mentioning it: a reader deciding how to pay
 * had to reach the bottom to learn the option existed. It now appears in the
 * headline and the first paragraph, and again where the reader is actually
 * weighing the choice.
 */
export default function Ownership() {
  useTitle("Yacht ownership & co-ownership | Cresta Marine");

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-intro page-intro--wide" data-reveal>
          <span className="eyebrow">Ownership</span>
          <h1>Own it outright. Finance it. Or own the time you use.</h1>
          <p>
            Three ways to put a Kumbra on the water: buy it outright, spread
            the cost with{" "}
            <Link className="text-link" href="/yacht-finance">yacht financing</Link>, or take a share
            of one boat alongside a few other owners. Cresta Marine looks after
            the yacht whichever route you take — berthing, servicing, cleaning
            and preparation — and My Cresta keeps every owner looking at the
            same information.
          </p>
        </section>

        <section className="about-story" data-reveal>
          <div>
            <span className="eyebrow">Choosing how to buy</span>
            <h2>How often will you really use it?</h2>
          </div>
          <div>
            <p>
              A boat spends more of the year at its berth than most owners
              expect. Buying outright is right when you want yours available on
              any day, kept to your specification, with nobody else&apos;s
              plans to work around.
            </p>
            <p>
              <Link className="text-link" href="/yacht-finance">Financing</Link> changes when you pay
              rather than what you own: the boat is yours, with the cost spread
              over up to five years through our partner Contact, subject to
              approval.
            </p>
            <p>
              A share suits owners whose time on the water falls into
              particular months. You buy part of one specific yacht — not
              access to a pool — and the owners agree the specification
              together before it is built.
            </p>
          </div>
        </section>

        <section className="values-grid" data-reveal data-reveal-stagger>
          <article>
            <span>Full</span>
            <h2>The whole boat</h2>
            <p>
              Sole ownership and sole use, specified entirely around you.
              Cresta manages berthing, servicing and yacht care so the boat is
              ready whenever you are.
            </p>
          </article>
          <article>
            <span>1/2</span>
            <h2>A half share</h2>
            <p>
              Two owners, one yacht. The closest thing to owning it outright,
              for roughly half the price and half the running costs, with the
              year divided between you.
            </p>
          </article>
          <article>
            <span>1/4 · 1/5</span>
            <h2>A quarter or a fifth</h2>
            <p>
              For owners who use a boat in particular seasons rather than all
              year. The least expensive way into a new Kumbra, kept to exactly
              the same standard.
            </p>
          </article>
        </section>

        <section className="connected-experience" data-reveal>
          <div>
            <span className="eyebrow eyebrow--light">
              Co-ownership, run properly
            </span>
            <h2>Fair time. Honest numbers. No awkward conversations.</h2>
          </div>
          <div className="connected-experience-copy">
            <p>
              Shared boats fail on two things: who gets the good weekends, and
              who paid for what. My Cresta is built to remove both arguments.
              Time is allocated so that desirable dates rotate between owners
              rather than settling permanently on whoever books fastest, and
              the calendar is visible to everyone who shares the boat.
            </p>
            <p>
              Every cost the boat incurs is recorded as it happens rather than
              estimated — berthing, insurance, servicing, cleaning, fuel and
              preparation — then split according to the size of each share.
              All the owners see the same figures, so a bill is never a
              surprise and nobody has to keep their own spreadsheet.
            </p>
            <p>
              Servicing, cleaning and trip preparation are requested through
              the same account, by any owner, and carried out by Cresta. The
              boat is looked after by one team to one standard, whoever is
              aboard next.
            </p>
            <Link className="button button--light" href="/my-cresta">
              My Cresta
            </Link>
          </div>
        </section>

        <section className="about-story" data-reveal>
          <div>
            <span className="eyebrow">Yacht care</span>
            <h2>Ready before you arrive.</h2>
          </div>
          <div>
            <p>
              Cleaning, fuelling, servicing, provisioning and trip preparation
              are requested in the app and handled at Abu Tig Marina, without a
              chain of phone calls. Owners across the Red Sea and Egypt&apos;s
              North Coast are supported the same way.
            </p>
            <p>
              Documents, service history and quotations stay in your account
              for as long as you own the boat — which matters most on the day
              you come to sell it.
            </p>
          </div>
        </section>

        <section className="model-cta" data-reveal>
          <div>
            <span className="eyebrow">Ownership, arranged</span>
            <h2>Start with the boat. We will handle the rest.</h2>
            <p>
              Configure the Kumbra you want and tell us how you intend to use
              it. We will price it three ways — outright, financed and as a
              share — so you can compare them side by side.
            </p>
          </div>
          <Link
            className="button button--primary button--configure"
            href="/configure"
          >
            Configure your boat
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
