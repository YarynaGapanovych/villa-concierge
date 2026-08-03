import Link from "next/link";
import { MapPinIcon } from "lucide-react";

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
      <p className="rounded-2xl border border-dashed border-stone-200 bg-white/60 px-3 py-6 text-lg text-stone-600">
        No clients found. Run{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 text-stone-800">
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
            <Card className="h-full overflow-hidden rounded-2xl border-stone-200/80 bg-white/80 shadow-sm shadow-stone-200/50 transition-colors hover:bg-white/95">
              <CardContent className="space-y-3 p-5">
                <div className="space-y-1">
                  <h2 className="font-[family-name:var(--font-proposal-display)] text-2xl font-medium text-stone-900">
                    {reservation.member.name}
                  </h2>
                  <p className="text-base text-stone-600">
                    {reservation.member.email}
                  </p>
                </div>

                <div className="flex items-start gap-2 text-lg font-medium text-stone-800">
                  <MapPinIcon
                    className="mt-0.5 size-4 shrink-0 text-stone-500"
                    aria-hidden="true"
                  />
                  <span>
                    {reservation.destination} · {reservation.villa}
                  </span>
                </div>

                <span className="inline-flex w-fit items-center rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-base font-medium tabular-nums text-stone-800">
                  {formatStayDates(
                    reservation.arrivalDate,
                    reservation.departureDate,
                  )}
                </span>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
