"use client";

import { useState } from "react";

import {
  MemberProposalActionButton,
  MemberProposalConfirmed,
  MemberProposalView,
  type MemberProposalData,
} from "@/components/member-proposal-view";
import { memberFirstName } from "@/lib/proposal-utils";

const TRANSITION_MS = 400;

export function MemberProposalClient({
  initialProposal,
}: {
  initialProposal: MemberProposalData;
}) {
  const [proposal, setProposal] = useState(initialProposal);
  const [visible, setVisible] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberName = memberFirstName(proposal.reservation.member.name);
  const total = proposal.items.reduce((sum, item) => sum + item.price, 0);
  const { status } = proposal;

  async function transitionToStatus(nextStatus: "approved" | "paid") {
    setUpdating(true);
    setError(null);
    setVisible(false);

    await new Promise((resolve) => setTimeout(resolve, TRANSITION_MS));

    try {
      const patchRes = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!patchRes.ok) {
        const body = (await patchRes.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to update proposal");
      }

      const fetchRes = await fetch(`/api/proposals/${proposal.id}`);
      if (!fetchRes.ok) {
        throw new Error("Failed to refresh proposal");
      }

      const refreshed = (await fetchRes.json()) as MemberProposalData;
      setProposal(refreshed);
      setVisible(true);
    } catch (updateError) {
      setVisible(true);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setUpdating(false);
    }
  }

  const actions = (
    <div
      className="text-center transition-opacity duration-500 ease-in-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {status === "sent" && (
        <MemberProposalActionButton
          onClick={() => void transitionToStatus("approved")}
          disabled={updating}
        >
          {updating ? "Confirming…" : "Approve Proposal"}
        </MemberProposalActionButton>
      )}

      {status === "approved" && (
        <MemberProposalActionButton
          onClick={() => void transitionToStatus("paid")}
          disabled={updating}
        >
          {updating ? "Processing…" : "Pay & Lock In"}
        </MemberProposalActionButton>
      )}

      {status === "paid" && (
        <MemberProposalConfirmed
          memberName={memberName}
          destination={proposal.reservation.destination}
          total={total}
        />
      )}

      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );

  return <MemberProposalView proposal={proposal} actions={actions} />;
}
