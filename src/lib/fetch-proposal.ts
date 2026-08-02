import { headers } from "next/headers";

import type { MemberProposalData } from "@/components/member-proposal-view";

export async function fetchProposal(
  id: string,
): Promise<MemberProposalData | null> {
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

  return (await response.json()) as MemberProposalData;
}
