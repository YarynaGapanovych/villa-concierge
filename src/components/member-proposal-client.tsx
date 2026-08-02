"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  MemberProposalActionButton,
  MemberProposalView,
  type MemberProposalData,
} from "@/components/member-proposal-view";

export function MemberProposalClient({
  initialProposal,
}: {
  initialProposal: MemberProposalData;
}) {
  const router = useRouter();
  const [proposal] = useState(initialProposal);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setUpdating(true);
    setError(null);

    try {
      const patchRes = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!patchRes.ok) {
        const body = (await patchRes.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to update proposal");
      }

      router.push(`/proposal/${proposal.id}/pay`);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setUpdating(false);
    }
  }

  const actions =
    proposal.status === "sent" ? (
      <div className="text-center">
        <MemberProposalActionButton
          onClick={() => void handleApprove()}
          disabled={updating}
        >
          {updating ? "Confirming…" : "Approve Proposal"}
        </MemberProposalActionButton>

        {error && (
          <p className="mt-4 text-base text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>
    ) : null;

  return <MemberProposalView proposal={proposal} actions={actions} />;
}
