import { notFound } from "next/navigation";

import { ConciergeDashboard } from "@/components/concierge-dashboard";
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
  );
}
