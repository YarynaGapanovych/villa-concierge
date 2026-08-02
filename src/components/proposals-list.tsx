"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProposalStatusBadge } from "@/components/proposal-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatShortDate } from "@/lib/format-dates";

type ProposalListItem = {
  id: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  items: Array<{ price: number }>;
  reservation: {
    destination: string;
    villa: string;
    member: {
      name: string;
    };
  };
};

export function ProposalsList() {
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProposals() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/proposals");
        if (!response.ok) {
          throw new Error("Failed to load proposals");
        }

        const data = (await response.json()) as ProposalListItem[];

        if (!cancelled) {
          setProposals(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load proposals",
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
  }, []);

  if (loading) {
    return (
      <p className="text-lg text-muted-foreground">Loading proposals…</p>
    );
  }

  if (error) {
    return (
      <p className="text-lg text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (proposals.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-6 text-lg text-muted-foreground">
        No proposals yet.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {proposals.map((proposal) => {
        const total = proposal.items.reduce((sum, item) => sum + item.price, 0);
        const itemCount = proposal.items.length;

        return (
          <li key={proposal.id}>
            <Link href={`/proposal/${proposal.id}`} className="block">
              <Card
                size="sm"
                className="py-2 transition-colors hover:bg-muted/40"
              >
                <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-0 text-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {proposal.reservation.destination} ·{" "}
                      {proposal.reservation.villa}
                    </p>
                    <p className="text-base text-muted-foreground">
                      {proposal.reservation.member.name}
                    </p>
                  </div>

                  <ProposalStatusBadge status={proposal.status} />

                  <span className="shrink-0 text-base tabular-nums text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                    {formatPrice(total)}
                  </span>

                  <span className="shrink-0 text-base text-muted-foreground">
                    Created {formatShortDate(proposal.createdAt)}
                    {proposal.sentAt
                      ? ` · Sent ${formatShortDate(proposal.sentAt)}`
                      : ""}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
