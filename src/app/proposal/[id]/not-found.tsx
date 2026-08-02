export default function ProposalNotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md space-y-3">
        <p className="font-[family-name:var(--font-proposal-display)] text-sm tracking-[0.3em] text-stone-500 uppercase">
          Villa Concierge
        </p>
        <h1 className="font-[family-name:var(--font-proposal-display)] text-3xl font-medium text-stone-800">
          Itinerary not found
        </h1>
        <p className="text-sm leading-relaxed text-stone-600">
          This proposal may have expired or the link is incorrect. Please contact
          your concierge for assistance.
        </p>
      </div>
    </main>
  );
}
