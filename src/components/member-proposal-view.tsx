import type { ReactNode } from "react";

import {
  formatPriceDetailed,
  formatStayDates,
} from "@/lib/format-dates";
import { MemberProposalItinerary } from "@/components/member-proposal-itinerary";
import {
  memberFirstName,
  type ProposalItemData,
} from "@/lib/proposal-utils";

export type MemberProposalData = {
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
        <p className="font-[family-name:var(--font-proposal-display)] text-xs font-medium tracking-[0.25em] text-stone-500 uppercase">
          A note from your concierge
        </p>
        <p className="font-[family-name:var(--font-proposal-display)] text-xl leading-relaxed text-stone-700 italic md:text-2xl">
          &ldquo;{note}&rdquo;
        </p>
      </blockquote>
    </div>
  );
}

export function MemberProposalPreparing({ memberName }: { memberName: string }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md space-y-4">
        <p className="font-[family-name:var(--font-proposal-display)] text-sm tracking-[0.3em] text-stone-500 uppercase">
          Villa Concierge
        </p>
        <h1 className="font-[family-name:var(--font-proposal-display)] text-3xl font-medium text-stone-800 md:text-4xl">
          Your itinerary is being prepared
        </h1>
        <p className="text-base leading-relaxed text-stone-600">
          Thank you, {memberName}. Your personal concierge is curating experiences
          for your upcoming stay. We will share your bespoke itinerary shortly.
        </p>
      </div>
    </main>
  );
}

export function MemberProposalView({
  proposal,
  actions,
}: {
  proposal: MemberProposalData;
  actions?: ReactNode;
}) {
  const { reservation, items, notes } = proposal;
  const memberName = memberFirstName(reservation.member.name);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className="min-h-full bg-stone-50">
      <header className="relative overflow-hidden bg-gradient-to-b from-stone-200/70 via-stone-100 to-stone-50 px-6 pt-16 pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.55),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl space-y-5">
          <p className="font-[family-name:var(--font-proposal-display)] text-sm tracking-[0.35em] text-stone-500 uppercase">
            Your curated stay
          </p>
          <h1 className="font-[family-name:var(--font-proposal-display)] text-4xl leading-tight font-medium text-stone-900 md:text-5xl">
            {reservation.villa}
          </h1>
          <p className="font-[family-name:var(--font-proposal-display)] text-2xl text-stone-700 md:text-3xl">
            {reservation.destination}
          </p>
          <p className="text-sm tracking-wide text-stone-600">
            {formatStayDates(reservation.arrivalDate, reservation.departureDate)}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-24">
        <section className="-mt-10 mb-12 text-center">
          <p className="font-[family-name:var(--font-proposal-display)] text-2xl text-stone-800 md:text-3xl">
            Welcome, {memberName}
          </p>
          <p className="mt-2 text-sm text-stone-600">
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
            <p className="text-xs tracking-[0.25em] text-stone-500 uppercase">
              Estimated total
            </p>
            <p className="mt-3 font-[family-name:var(--font-proposal-display)] text-5xl font-medium text-stone-900 tabular-nums md:text-6xl">
              {formatPriceDetailed(total)}
            </p>
            <p className="mt-4 mx-auto max-w-md text-sm leading-relaxed text-stone-600">
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

export function MemberProposalConfirmed({
  memberName,
  destination,
  total,
}: {
  memberName: string;
  destination: string;
  total: number;
}) {
  return (
    <div className="mt-12 rounded-2xl border border-stone-200 bg-white/90 px-8 py-12 text-center shadow-sm shadow-stone-200/60">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-stone-900 text-stone-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-8"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 className="font-[family-name:var(--font-proposal-display)] text-3xl font-medium text-stone-900 md:text-4xl">
        You&apos;re all set, {memberName}!
      </h2>
      <p className="mt-3 text-base leading-relaxed text-stone-600">
        Your trip to {destination} is confirmed.
      </p>
      <div className="mt-8 border-t border-stone-100 pt-6">
        <p className="text-xs tracking-[0.25em] text-stone-500 uppercase">
          Total paid
        </p>
        <p className="mt-2 font-[family-name:var(--font-proposal-display)] text-4xl font-medium text-stone-900 tabular-nums">
          {formatPriceDetailed(total)}
        </p>
      </div>
    </div>
  );
}

export function MemberProposalActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-stone-800 bg-stone-900 px-10 py-3.5 font-[family-name:var(--font-proposal-display)] text-lg tracking-wide text-stone-50 transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
