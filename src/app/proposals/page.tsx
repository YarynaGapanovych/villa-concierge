import { ConciergeNav } from "@/components/concierge-nav";
import { ProposalsList } from "@/components/proposals-list";

export default function ProposalsPage() {
  return (
    <>
      <ConciergeNav active="proposals" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Sent Proposals</h1>
          <p className="text-lg text-muted-foreground">
            All proposals across reservations. Click to open the member view.
          </p>
        </div>
        <ProposalsList />
      </main>
    </>
  );
}
