"use client";

import { MapPinIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { ProposalCard, type ProposalDetails } from "@/components/proposal-card";
import { Button } from "@/components/ui/button";
import { formatStayDates } from "@/lib/format-dates";

type ReservationData = {
  id: string;
  destination: string;
  villa: string;
  arrivalDate: string;
  departureDate: string;
  member: {
    name: string;
    email: string;
  };
};

type ProposalListItem = ProposalDetails & {
  reservationId: string;
};

function toProposalDetails(proposal: ProposalListItem): ProposalDetails {
  return {
    id: proposal.id,
    status: proposal.status,
    notes: proposal.notes,
    items: proposal.items,
    createdAt: proposal.createdAt,
    sentAt: proposal.sentAt,
  };
}

export function ConciergeDashboard({
  reservation,
  initialProposals,
}: {
  reservation: ReservationData;
  initialProposals: ProposalDetails[];
}) {
  const [proposals, setProposals] = useState(initialProposals);
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateProposal(next: ProposalDetails) {
    setProposals((current) =>
      current.map((proposal) => (proposal.id === next.id ? next : proposal)),
    );
  }

  async function handleNewProposal() {
    setCreatingProposal(true);
    setError(null);

    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: reservation.id }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to create proposal");
      }

      const created = toProposalDetails(
        (await response.json()) as ProposalListItem,
      );

      setProposals((current) => [created, ...current]);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create proposal",
      );
    } finally {
      setCreatingProposal(false);
    }
  }

  function handleSendSuccess(sent: ProposalDetails) {
    setProposals((current) =>
      current.map((proposal) => (proposal.id === sent.id ? sent : proposal)),
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-12 pb-24 md:pt-16">
      <header className="space-y-4">
        <div className="space-y-1">
          <p className="font-[family-name:var(--font-proposal-display)] text-sm tracking-[0.3em] text-stone-500 uppercase">
            Villa Concierge
          </p>
          <h1 className="font-[family-name:var(--font-proposal-display)] text-4xl font-medium text-stone-900 md:text-5xl">
            {reservation.member.name}
          </h1>
          <p className="text-base text-stone-600">
            {reservation.member.email}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-lg font-medium text-stone-800">
            <MapPinIcon
              className="size-4 shrink-0 text-stone-500"
              aria-hidden="true"
            />
            <span>
              {reservation.destination} · {reservation.villa}
            </span>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-stone-200 bg-white/70 px-3 py-1.5 text-base font-medium tabular-nums text-stone-800">
            {formatStayDates(
              reservation.arrivalDate,
              reservation.departureDate,
            )}
          </span>
        </div>
      </header>

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={creatingProposal}
          onClick={() => void handleNewProposal()}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          {creatingProposal ? "Creating…" : "New Proposal"}
        </Button>
      </div>

      {error && (
        <p className="text-lg text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            reservation={reservation}
            onUpdate={updateProposal}
            onSendSuccess={handleSendSuccess}
            onError={setError}
          />
        ))}
      </div>
    </main>
  );
}
