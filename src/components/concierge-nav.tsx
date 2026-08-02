import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/proposals", label: "Proposals" },
] as const;

export function ConciergeNav({
  active,
}: {
  active: "dashboard" | "proposals";
}) {
  return (
    <nav className="flex items-center gap-1 border-b border-border bg-background px-4 py-2.5">
      {links.map((link) => {
        const isActive =
          (active === "dashboard" && link.href === "/") ||
          (active === "proposals" && link.href === "/proposals");

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-2.5 py-1 text-lg font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
