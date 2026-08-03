import Link from "next/link";

export default function ClientNotFound() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-4 p-4">
        <p className="font-[family-name:var(--font-proposal-display)] text-sm tracking-[0.3em] text-stone-500 uppercase">
          Villa Concierge
        </p>
        <h1 className="font-[family-name:var(--font-proposal-display)] text-4xl font-medium text-stone-900">
          Client not found
        </h1>
        <p className="text-lg text-stone-600">
          This reservation does not exist or may have been removed.
        </p>
        <Link
          href="/"
          className="text-lg text-stone-800 underline-offset-4 hover:underline"
        >
          ← Back to Clients
        </Link>
      </main>
    </>
  );
}
