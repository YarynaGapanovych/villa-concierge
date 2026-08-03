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
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-4 pb-24">
          <p className="text-lg text-destructive" role="alert">
            Failed to load clients. Please try again.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-4 pb-24">
        <header className="space-y-1">
          <p className="font-[family-name:var(--font-proposal-display)] text-sm tracking-[0.3em] text-stone-500 uppercase">
            Villa Concierge
          </p>
          <h1 className="font-[family-name:var(--font-proposal-display)] text-4xl font-medium text-stone-900 md:text-5xl">
            Clients
          </h1>
          <p className="text-lg text-stone-600">
            Select a member to manage their itinerary proposals.
          </p>
        </header>
        <ClientsList reservations={reservations} />
      </main>
    </>
  );
}
