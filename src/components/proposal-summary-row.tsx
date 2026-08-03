import Link from "next/link";

import { ProposalStatusBadge } from "@/components/proposal-status-badge";
import { formatPrice, formatShortDate } from "@/lib/format-dates";

export type ProposalSummaryData = {
  id: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  items: Array<{ price: number }>;
};

export function ProposalSummaryRow({
  proposal,
  memberViewHref,
}: {
  proposal: ProposalSummaryData;
  memberViewHref?: string;
}) {
  const total = proposal.items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = proposal.items.length;

  const content = (
    <>
      <ProposalStatusBadge status={proposal.status} />
      <span className="tabular-nums text-muted-foreground">
        {itemCount} {itemCount === 1 ? "item" : "items"} · {formatPrice(total)}
      </span>
      <span className="text-muted-foreground">
        Created {formatShortDate(proposal.createdAt)}
        {proposal.sentAt ? ` · Sent ${formatShortDate(proposal.sentAt)}` : ""}
      </span>
    </>
  );

  if (memberViewHref) {
    return (
      <Link
        href={memberViewHref}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base transition-colors hover:text-foreground"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
      {content}
    </div>
  );
}

export function ProposalsOverview({
  proposals,
}: {
  proposals: ProposalSummaryData[];
}) {
  if (proposals.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-6 text-lg text-muted-foreground">
        No proposals yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {proposals.map((proposal) => (
        <li key={proposal.id} className="px-4 py-3">
          <ProposalSummaryRow
            proposal={proposal}
            memberViewHref={
              proposal.status !== "draft"
                ? `/proposal/${proposal.id}`
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
