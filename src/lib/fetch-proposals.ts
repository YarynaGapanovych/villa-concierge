import { cache } from "react";

import { prisma } from "@/lib/prisma";

export type ProposalItemRecord = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  price: number;
};

export type ProposalRecord = {
  id: string;
  status: string;
  notes: string | null;
  items: ProposalItemRecord[];
  createdAt: string;
  sentAt: string | null;
};

function serializeProposal(proposal: {
  id: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  sentAt: Date | null;
  items: Array<{
    id: string;
    category: string;
    title: string;
    description: string | null;
    scheduledAt: Date;
    price: number;
  }>;
}): ProposalRecord {
  return {
    id: proposal.id,
    status: proposal.status,
    notes: proposal.notes,
    createdAt: proposal.createdAt.toISOString(),
    sentAt: proposal.sentAt?.toISOString() ?? null,
    items: proposal.items.map((item) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      description: item.description,
      scheduledAt: item.scheduledAt.toISOString(),
      price: item.price,
    })),
  };
}

export const fetchProposalsForReservation = cache(
  async (reservationId: string): Promise<ProposalRecord[]> => {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.proposal.findMany({
        where: { reservationId },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });

      if (existing.length > 0) {
        return existing.map(serializeProposal);
      }

      await tx.proposal.create({
        data: {
          reservationId,
          status: "draft",
        },
      });

      const proposals = await tx.proposal.findMany({
        where: { reservationId },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });

      return proposals.map(serializeProposal);
    });
  },
);
