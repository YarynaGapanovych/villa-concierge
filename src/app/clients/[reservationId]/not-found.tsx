import Link from "next/link";

import { ConciergeNav } from "@/components/concierge-nav";

export default function ClientNotFound() {
  return (
    <>
      <ConciergeNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-4 p-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Client not found
        </h1>
        <p className="text-lg text-muted-foreground">
          This reservation does not exist or may have been removed.
        </p>
        <Link
          href="/"
          className="text-lg text-primary underline-offset-4 hover:underline"
        >
          ← Back to Clients
        </Link>
      </main>
    </>
  );
}
