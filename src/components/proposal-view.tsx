import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { MemberProposalItinerary } from "@/components/member-proposal-itinerary";
import {
  formatPriceDetailed,
  formatStayDates,
} from "@/lib/format-dates";
import { cn } from "@/lib/utils";
import {
  memberFirstName,
  type ProposalItemData,
} from "@/lib/proposal-utils";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-proposal-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-proposal-body",
});

export type ProposalViewData = {
  id: string;
  status: string;
  notes: string | null;
  items: ProposalItemData[];
  reservation: {
    destination: string;
    villa: string;
    arrivalDate: string;
    departureDate: string;
    member: {
      name: string;
    };
  };
};

function ConciergeNote({ note }: { note: string }) {
  return (
    <div className="relative mx-auto max-w-2xl px-6 py-10">
      <div className="absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
      <blockquote className="space-y-3 text-center">
        <p className="font-[family-name:var(--font-proposal-display)] text-base font-medium tracking-[0.25em] text-stone-500 uppercase">
          A note from your concierge
        </p>
        <p className="font-[family-name:var(--font-proposal-display)] text-3xl leading-relaxed text-stone-700 italic md:text-4xl">
          &ldquo;{note}&rdquo;
        </p>
      </blockquote>
    </div>
  );
}

export function ProposalViewFrame({
  children,
  embedded = false,
}: {
  children: ReactNode;
  embedded?: boolean;
}) {
  return (
    <div
      className={cn(
        `${displayFont.variable} ${bodyFont.variable} font-[family-name:var(--font-proposal-body)] text-stone-800 antialiased`,
        !embedded && "min-h-full",
      )}
    >
      {children}
    </div>
  );
}

export function ProposalView({
  proposal,
  actions,
  embedded = false,
}: {
  proposal: ProposalViewData;
  actions?: ReactNode;
  embedded?: boolean;
}) {
  const { reservation, items, notes } = proposal;
  const memberName = memberFirstName(reservation.member.name);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className={cn("bg-stone-50", !embedded && "min-h-full")}>
      <header className="relative overflow-hidden bg-gradient-to-b from-stone-200/70 via-stone-100 to-stone-50 px-6 pt-16 pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.55),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl space-y-5">
          <p className="font-[family-name:var(--font-proposal-display)] text-lg tracking-[0.35em] text-stone-500 uppercase">
            Your curated stay
          </p>
          <h1 className="font-[family-name:var(--font-proposal-display)] text-6xl leading-tight font-medium text-stone-900 md:text-7xl">
            {reservation.villa}
          </h1>
          <p className="font-[family-name:var(--font-proposal-display)] text-4xl text-stone-700 md:text-5xl">
            {reservation.destination}
          </p>
          <p className="text-lg tracking-wide text-stone-600">
            {formatStayDates(reservation.arrivalDate, reservation.departureDate)}
          </p>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <section className="-mt-10 mb-12 text-center">
          <p className="font-[family-name:var(--font-proposal-display)] text-4xl text-stone-800 md:text-5xl">
            Welcome, {memberName}
          </p>
          <p className="mt-2 text-lg text-stone-600">
            We are delighted to present the experiences we have arranged for you.
          </p>
        </section>

        {notes?.trim() && <ConciergeNote note={notes.trim()} />}

        <MemberProposalItinerary
          items={items}
          arrivalDate={reservation.arrivalDate}
          departureDate={reservation.departureDate}
        />

        {items.length > 0 && (
          <footer className="mt-16 border-t border-stone-200 pt-10 text-center">
            <p className="text-base tracking-[0.25em] text-stone-500 uppercase">
              Estimated total
            </p>
            <p className="mt-3 font-[family-name:var(--font-proposal-display)] text-7xl font-medium text-stone-900 tabular-nums md:text-8xl">
              {formatPriceDetailed(total)}
            </p>
            <p className="mt-4 mx-auto max-w-md text-lg leading-relaxed text-stone-600">
              All experiences are subject to availability. Your concierge remains
              at your service for any adjustments.
            </p>
          </footer>
        )}

        {actions && <div className="mt-12">{actions}</div>}
      </div>
    </main>
  );
}

export type { ProposalItemData };
