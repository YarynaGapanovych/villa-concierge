import Link from "next/link";
import { notFound } from "next/navigation";

import { ConciergeDashboard } from "@/components/concierge-dashboard";
import { ConciergeNav } from "@/components/concierge-nav";
import { fetchReservation } from "@/lib/fetch-reservations";

export const dynamic = "force-dynamic";

type ClientDetailPageProps = {
  params: Promise<{ reservationId: string }>;
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { reservationId } = await params;
  const reservation = await fetchReservation(reservationId);

  if (!reservation) {
    notFound();
  }

  return (
    <>
      <ConciergeNav />
      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        <Link
          href="/"
          className="inline-flex text-base text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Clients
        </Link>
      </div>
      <ConciergeDashboard
        reservation={{
          id: reservation.id,
          destination: reservation.destination,
          villa: reservation.villa,
          arrivalDate: reservation.arrivalDate,
          departureDate: reservation.departureDate,
          member: reservation.member,
        }}
      />
    </>
  );
}
