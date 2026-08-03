import { notFound } from "next/navigation";

import { ConciergeDashboard } from "@/components/concierge-dashboard";
import { fetchProposalsForReservation } from "@/lib/fetch-proposals";
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

  const proposals = await fetchProposalsForReservation(reservationId);

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
      initialProposals={proposals}
    />
  );
}
