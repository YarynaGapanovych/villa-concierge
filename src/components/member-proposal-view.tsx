import type { ReactNode } from "react";

import {
  ProposalView,
  type ProposalViewData,
} from "@/components/proposal-view";
import { formatPriceDetailed } from "@/lib/format-dates";

export type MemberProposalData = ProposalViewData;

export function MemberProposalPreparing({ memberName }: { memberName: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-md space-y-4">
          <p className="font-[family-name:var(--font-proposal-display)] text-lg tracking-[0.3em] text-stone-500 uppercase">
            Villa Concierge
          </p>
          <h1 className="font-[family-name:var(--font-proposal-display)] text-5xl font-medium text-stone-800 md:text-6xl">
            Your itinerary is being prepared
          </h1>
          <p className="text-xl leading-relaxed text-stone-600">
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
  return <ProposalView proposal={proposal} actions={actions} />;
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
    <div className="rounded-2xl border border-stone-200 bg-white/90 px-8 py-12 text-center shadow-sm shadow-stone-200/60 lg:px-12 lg:py-16">
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
      <h2 className="font-[family-name:var(--font-proposal-display)] text-5xl font-medium text-stone-900 md:text-6xl">
        You&apos;re all set, {memberName}!
      </h2>
      <p className="mt-3 text-xl leading-relaxed text-stone-600">
        Your trip to {destination} is confirmed.
      </p>
      <div className="mt-8 border-t border-stone-100 pt-6">
        <p className="text-base tracking-[0.25em] text-stone-500 uppercase">
          Total paid
        </p>
        <p className="mt-2 font-[family-name:var(--font-proposal-display)] text-6xl font-medium text-stone-900 tabular-nums">
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
      className="rounded-full border border-stone-800 bg-stone-900 px-10 py-3.5 font-[family-name:var(--font-proposal-display)] text-2xl tracking-wide text-stone-50 transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
