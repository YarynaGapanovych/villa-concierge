import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        items: true,
        reservation: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const now = new Date();
    const itemCount = proposal.items.length;
    const total = proposal.items.reduce((sum, item) => sum + item.price, 0);
    const bodyPreview = `Your itinerary for ${proposal.reservation.destination} is ready to review — ${itemCount} items, total $${total.toFixed(2)}`;

    const [updatedProposal, sentEmail] = await prisma.$transaction([
      prisma.proposal.update({
        where: { id },
        data: {
          status: "sent",
          sentAt: now,
        },
        include: {
          items: {
            orderBy: { scheduledAt: "asc" },
          },
          reservation: {
            include: {
              member: true,
            },
          },
        },
      }),
      prisma.sentEmail.create({
        data: {
          proposalId: id,
          toEmail: proposal.reservation.member.email,
          sentAt: now,
          bodyPreview,
        },
      }),
    ]);

    console.log(
      `[Simulated email send] To: ${sentEmail.toEmail} | ${bodyPreview}`,
    );

    return NextResponse.json({ proposal: updatedProposal, sentEmail });
  } catch {
    return NextResponse.json(
      { error: "Failed to send proposal" },
      { status: 500 },
    );
  }
}
