import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { MemberProposalClient } from "@/components/member-proposal-client";
import {
  MemberProposalPreparing,
  type MemberProposalData,
} from "@/components/member-proposal-view";
import { memberFirstName } from "@/lib/proposal-utils";

export const dynamic = "force-dynamic";

async function fetchProposal(id: string): Promise<MemberProposalData | null> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const response = await fetch(`${protocol}://${host}/api/proposals/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch proposal");
  }

  const proposal = (await response.json()) as MemberProposalData;

  return proposal;
}

type ProposalMemberPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProposalMemberPage({
  params,
}: ProposalMemberPageProps) {
  const { id } = await params;
  const proposal = await fetchProposal(id);

  if (!proposal) {
    notFound();
  }

  if (proposal.status === "draft") {
    return (
      <MemberProposalPreparing
        memberName={memberFirstName(proposal.reservation.member.name)}
      />
    );
  }

  return <MemberProposalClient initialProposal={proposal} />;
}
