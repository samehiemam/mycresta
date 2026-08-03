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
 */
export default function Ownership() {
  useTitle("Yacht ownership & co-ownership | Cresta Marine");

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-intro page-intro--wide" data-reveal>
          <span className="eyebrow">Ownership</span>
          <h1>Own it outright, or own the time you use.</h1>
          <p>
            A Kumbra can be yours entirely, or shared with a small group who
            want the same thing from the water. Either way Cresta Marine
            handles the boat — berthing, servicing, cleaning and preparation —
            and My Cresta keeps every owner looking at the same information.
          </p>
        </section>

        <section className="about-story" data-reveal>
          <div>
            <span className="eyebrow">Choosing the model</span>
            <h2>How much boat do you actually use?</h2>
          </div>
          <div>
            <p>
              Most boats spend the overwhelming majority of the year at their
              berth. Full ownership makes sense when you want the boat
              available on any day, kept exactly to your specification, with
              nobody else&apos;s schedule to consider.
            </p>
            <p>
              Co-ownership makes sense when you want the same boat and the same
              standard for a fraction of the cost, and your use concentrates
              into parts of the year. You buy a share of a specific yacht — not
              access to a pool — and it is configured once, by the owners,
              before it is built.
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
              Two owners, one yacht. The closest thing to full ownership, at
              roughly half the capital and half the running cost, with time
              divided between you.
            </p>
          </article>
          <article>
            <span>1/4 · 1/5</span>
            <h2>A quarter or a fifth</h2>
            <p>
              For owners whose boating concentrates into particular seasons or
              weeks. The lowest cost of entry to a new Kumbra, kept to exactly
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
              Costs are itemised against the boat rather than estimated —
              berthing, insurance, servicing, cleaning, fuel and preparation —
              and split according to each share. Every owner sees the same
              ledger, so a bill is never a surprise and nobody has to keep
              their own spreadsheet.
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
              it. We will show you what full ownership and a share each look
              like, including{" "}
              <Link href="/yacht-finance">yacht financing</Link> where it
              applies.
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
