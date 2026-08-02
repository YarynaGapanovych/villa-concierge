import { ConciergeDashboard } from "@/components/concierge-dashboard";
import { ConciergeNav } from "@/components/concierge-nav";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reservation = await prisma.reservation.findFirst({
    include: {
      member: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!reservation) {
    return (
      <>
        <ConciergeNav active="dashboard" />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center p-4">
          <p className="text-lg text-muted-foreground">
            No reservation found. Run{" "}
            <code className="rounded bg-muted px-1 py-0.5">pnpm exec prisma db seed</code>{" "}
            to load sample data.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <ConciergeNav active="dashboard" />
      <ConciergeDashboard
      reservation={{
        id: reservation.id,
        destination: reservation.destination,
        villa: reservation.villa,
        arrivalDate: reservation.arrivalDate.toISOString(),
        departureDate: reservation.departureDate.toISOString(),
        member: reservation.member,
      }}
    />
    </>
  );
}
