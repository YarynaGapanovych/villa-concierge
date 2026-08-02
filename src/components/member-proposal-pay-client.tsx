"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  MemberProposalActionButton,
  MemberProposalConfirmed,
  type MemberProposalData,
} from "@/components/member-proposal-view";
import { formatPriceDetailed, formatStayDates } from "@/lib/format-dates";
import { memberFirstName } from "@/lib/proposal-utils";

const TRANSITION_MS = 400;

export function MemberProposalPayClient({
  initialProposal,
}: {
  initialProposal: MemberProposalData;
}) {
  const router = useRouter();
  const [proposal, setProposal] = useState(initialProposal);
  const [visible, setVisible] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { reservation } = proposal;
  const memberName = memberFirstName(reservation.member.name);
  const total = proposal.items.reduce((sum, item) => sum + item.price, 0);

  async function handlePay() {
    setUpdating(true);
    setError(null);
    setVisible(false);

    await new Promise((resolve) => setTimeout(resolve, TRANSITION_MS));

    try {
      const patchRes = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
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
      router.refresh();
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

  return (
    <main className="min-h-full bg-stone-50">
      <header className="relative overflow-hidden bg-gradient-to-b from-stone-200/70 via-stone-100 to-stone-50 px-6 pt-16 pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.55),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl space-y-5">
          <p className="font-[family-name:var(--font-proposal-display)] text-base tracking-[0.35em] text-stone-500 uppercase">
            Confirm your stay
          </p>
          <h1 className="font-[family-name:var(--font-proposal-display)] text-5xl leading-tight font-medium text-stone-900 md:text-6xl">
            {reservation.villa}
          </h1>
          <p className="font-[family-name:var(--font-proposal-display)] text-3xl text-stone-700 md:text-4xl">
            {reservation.destination}
          </p>
          <p className="text-base tracking-wide text-stone-600">
            {formatStayDates(reservation.arrivalDate, reservation.departureDate)}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-24">
        <section className="-mt-10 mb-12 text-center">
          <p className="font-[family-name:var(--font-proposal-display)] text-3xl text-stone-800 md:text-4xl">
            Almost there, {memberName}
          </p>
          <p className="mt-2 text-base text-stone-600">
            Your proposal is approved. Complete payment to lock in your
            experiences.
          </p>
        </section>

        <div
          className="rounded-2xl border border-stone-200 bg-white/90 px-8 py-10 text-center shadow-sm shadow-stone-200/60 transition-opacity duration-500 ease-in-out"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {proposal.status === "paid" ? (
            <MemberProposalConfirmed
              memberName={memberName}
              destination={reservation.destination}
              total={total}
            />
          ) : (
            <>
              <p className="text-sm tracking-[0.25em] text-stone-500 uppercase">
                Amount due
              </p>
              <p className="mt-3 font-[family-name:var(--font-proposal-display)] text-6xl font-medium text-stone-900 tabular-nums md:text-7xl">
                {formatPriceDetailed(total)}
              </p>
              <p className="mt-4 mx-auto max-w-md text-base leading-relaxed text-stone-600">
                Payment is simulated for this prototype. Selecting Pay &amp; Lock In
                confirms your itinerary with your concierge.
              </p>
              <div className="mt-10">
                <MemberProposalActionButton
                  onClick={() => void handlePay()}
                  disabled={updating}
                >
                  {updating ? "Processing…" : "Pay & Lock In"}
                </MemberProposalActionButton>
              </div>
            </>
          )}

          {error && (
            <p className="mt-4 text-base text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
