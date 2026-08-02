import Link from "next/link";
import { MapPinIcon } from "lucide-react";

import { ProposalSummaryRow } from "@/components/proposal-summary-row";
import { Card, CardContent } from "@/components/ui/card";
import { formatStayDates } from "@/lib/format-dates";
import type { ReservationListItem } from "@/lib/fetch-reservations";

export function ClientsList({
  reservations,
}: {
  reservations: ReservationListItem[];
}) {
  if (reservations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-6 text-lg text-muted-foreground">
        No clients found. Run{" "}
        <code className="rounded bg-muted px-1 py-0.5">
          pnpm exec prisma db seed
        </code>{" "}
        to load sample data.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {reservations.map((reservation) => (
        <li key={reservation.id}>
          <Link href={`/clients/${reservation.id}`} className="block h-full">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardContent className="space-y-3 p-5">
                <div className="space-y-1">
                  <h2 className="font-heading text-2xl font-semibold tracking-tight">
                    {reservation.member.name}
                  </h2>
                  <p className="text-base text-muted-foreground">
                    {reservation.member.email}
                  </p>
                </div>

                <div className="flex items-start gap-2 text-lg font-medium">
                  <MapPinIcon
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>
                    {reservation.destination} · {reservation.villa}
                  </span>
                </div>

                <span className="inline-flex w-fit rounded-full border border-border bg-muted/60 px-3 py-1 text-base tabular-nums">
                  {formatStayDates(
                    reservation.arrivalDate,
                    reservation.departureDate,
                  )}
                </span>

                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    Proposals
                  </p>
                  {reservation.proposals.length === 0 ? (
                    <p className="text-base text-muted-foreground">
                      No proposals yet
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {reservation.proposals.map((proposal) => (
                        <li key={proposal.id}>
                          <ProposalSummaryRow proposal={proposal} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
