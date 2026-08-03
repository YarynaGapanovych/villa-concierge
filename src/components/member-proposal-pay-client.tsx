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

  if (proposal.status === "paid") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="mx-auto w-full max-w-2xl">
          <MemberProposalConfirmed
            memberName={memberName}
            destination={reservation.destination}
            total={total}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-stone-50 px-6 py-12 lg:py-20">
      <div className="w-full max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 xl:gap-24">
          <section className="space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <p className="font-[family-name:var(--font-proposal-display)] text-sm tracking-[0.35em] text-stone-500 uppercase lg:text-base">
                Confirm your stay
              </p>
              <h1 className="font-[family-name:var(--font-proposal-display)] text-4xl font-medium text-stone-900 md:text-5xl lg:text-6xl xl:text-7xl">
                Almost there, {memberName}
              </h1>
              <p className="mx-auto max-w-xl text-lg leading-relaxed text-stone-600 lg:mx-0 lg:text-xl">
                Your proposal is approved. Complete payment to lock in your
                experiences.
              </p>
            </div>

            <div className="space-y-1 text-base text-stone-500 lg:text-lg">
              <p className="font-[family-name:var(--font-proposal-display)] text-2xl text-stone-800 lg:text-3xl">
                {reservation.villa}
              </p>
              <p>{reservation.destination}</p>
              <p>
                {formatStayDates(
                  reservation.arrivalDate,
                  reservation.departureDate,
                )}
              </p>
            </div>

            {proposal.items.length > 0 && (
              <div className="hidden border-t border-stone-200 pt-8 lg:block">
                <p className="text-sm tracking-[0.25em] text-stone-500 uppercase">
                  {proposal.items.length}{" "}
                  {proposal.items.length === 1 ? "experience" : "experiences"}{" "}
                  included
                </p>
                <ul className="mt-5 space-y-4">
                  {proposal.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-baseline justify-between gap-6 border-b border-stone-100 pb-4 last:border-0 last:pb-0"
                    >
                      <span className="font-[family-name:var(--font-proposal-display)] text-xl text-stone-800">
                        {item.title}
                      </span>
                      <span className="shrink-0 font-[family-name:var(--font-proposal-display)] text-xl tabular-nums text-stone-600">
                        {formatPriceDetailed(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div
            className="rounded-2xl border border-stone-200 bg-white/90 px-8 py-10 text-center shadow-sm shadow-stone-200/60 transition-opacity duration-500 ease-in-out lg:px-10 lg:py-12 xl:px-12 xl:py-14"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <p className="text-base tracking-[0.25em] text-stone-500 uppercase">
              Amount due
            </p>
            <p className="mt-3 font-[family-name:var(--font-proposal-display)] text-6xl font-medium text-stone-900 tabular-nums md:text-7xl lg:text-8xl">
              {formatPriceDetailed(total)}
            </p>
            <p className="mx-auto mt-5 max-w-sm text-lg leading-relaxed text-stone-600 lg:max-w-none lg:text-xl">
              Payment is simulated for this prototype. Selecting Pay &amp; Lock In
              confirms your itinerary with your concierge.
            </p>
            <div className="mt-10 flex justify-center lg:mt-12">
              <MemberProposalActionButton
                onClick={() => void handlePay()}
                disabled={updating}
              >
                {updating ? "Processing…" : "Pay & Lock In"}
              </MemberProposalActionButton>
            </div>

            {error && (
              <p className="mt-4 text-lg text-red-700" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
