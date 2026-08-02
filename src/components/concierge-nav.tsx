import Link from "next/link";

export function ConciergeNav() {
  return (
    <nav className="border-b border-border bg-background px-4 py-2.5">
      <Link
        href="/"
        className="font-heading text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
      >
        Clients
      </Link>
    </nav>
  );
}
