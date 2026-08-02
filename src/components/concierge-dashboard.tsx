"use client";

import { MapPinIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";

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
}: {
  reservation: ReservationData;
}) {
  const [proposals, setProposals] = useState<ProposalDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProposals() {
      setLoading(true);
      setError(null);

      try {
        const proposalsRes = await fetch(
          `/api/proposals?reservationId=${encodeURIComponent(reservation.id)}`,
        );
        if (!proposalsRes.ok) {
          throw new Error("Failed to load proposals");
        }

        let allProposals = (await proposalsRes.json()) as ProposalListItem[];
        allProposals = allProposals.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        if (allProposals.length === 0) {
          const createRes = await fetch("/api/proposals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservationId: reservation.id }),
          });

          if (!createRes.ok) {
            const body = (await createRes.json()) as { error?: string };
            throw new Error(body.error ?? "Failed to create draft proposal");
          }

          const created = (await createRes.json()) as ProposalListItem;
          allProposals = [created];
        }

        if (!cancelled) {
          setProposals(allProposals.map(toProposalDetails));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to initialize dashboard",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProposals();

    return () => {
      cancelled = true;
    };
  }, [reservation.id]);

  function updateProposal(next: ProposalDetails) {
    setProposals((current) =>
      current.map((proposal) => (proposal.id === next.id ? next : proposal)),
    );
  }

  async function handleNewProposal() {
    setCreatingProposal(true);
    setError(null);
    setSuccessMessage(null);

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
    setSuccessMessage(`Proposal sent to ${reservation.member.email}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4">
      {successMessage && (
        <div
          className="rounded-lg border border-green-600/30 bg-green-50 px-3 py-2 text-lg text-green-900 dark:bg-green-950/40 dark:text-green-100"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <header className="space-y-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {reservation.member.name}
          </h1>
          <p className="text-base text-muted-foreground">
            {reservation.member.email}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPinIcon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>
              {reservation.destination} · {reservation.villa}
            </span>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/60 px-3 py-1.5 text-lg font-semibold tabular-nums">
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
          disabled={loading || creatingProposal}
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

      {loading ? (
        <p className="text-lg text-muted-foreground">Loading proposals…</p>
      ) : (
        <div className="flex flex-col gap-6">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              reservation={reservation}
              disabled={loading}
              onUpdate={updateProposal}
              onSendSuccess={handleSendSuccess}
              onError={setError}
            />
          ))}
        </div>
      )}
    </main>
  );
}
