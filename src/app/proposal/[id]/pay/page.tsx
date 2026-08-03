import { notFound, redirect } from "next/navigation";

import { MemberProposalPayClient } from "@/components/member-proposal-pay-client";
import { MemberProposalPreparing } from "@/components/member-proposal-view";
import { fetchProposal } from "@/lib/fetch-proposal";
import { memberFirstName } from "@/lib/proposal-utils";

export const dynamic = "force-dynamic";

type ProposalPayPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProposalPayPage({ params }: ProposalPayPageProps) {
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

  if (proposal.status === "sent") {
    redirect(`/proposal/${id}`);
  }

  return <MemberProposalPayClient initialProposal={proposal} />;
}
