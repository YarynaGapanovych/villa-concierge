import { ConciergeNav } from "@/components/concierge-nav";
import { ClientsList } from "@/components/clients-list";
import { fetchReservations } from "@/lib/fetch-reservations";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  let reservations: Awaited<ReturnType<typeof fetchReservations>> = [];

  try {
    reservations = await fetchReservations();
  } catch {
    return (
      <>
        <ConciergeNav />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4">
          <p className="text-lg text-destructive" role="alert">
            Failed to load clients. Please try again.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <ConciergeNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4">
        <header className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Clients
          </h1>
          <p className="text-lg text-muted-foreground">
            Select a member to manage their itinerary proposals.
          </p>
        </header>
        <ClientsList reservations={reservations} />
      </main>
    </>
  );
}
