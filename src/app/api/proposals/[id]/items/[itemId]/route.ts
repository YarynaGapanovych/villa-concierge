import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  isWithinReservationSchedule,
  reservationScheduleErrorMessage,
} from "@/lib/reservation-schedule";

async function getDraftProposalItem(
  proposalId: string,
  itemId: string,
) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      reservation: {
        select: {
          arrivalDate: true,
          departureDate: true,
        },
      },
    },
  });

  if (!proposal) {
    return { error: NextResponse.json({ error: "Proposal not found" }, { status: 404 }) };
  }

  if (proposal.status !== "draft") {
    return {
      error: NextResponse.json(
        { error: "Items can only be changed on draft proposals" },
        { status: 400 },
      ),
    };
  }

  const item = await prisma.proposalItem.findFirst({
    where: { id: itemId, proposalId },
  });

  if (!item) {
    return { error: NextResponse.json({ error: "Item not found" }, { status: 404 }) };
  }

  return { proposal, item };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId } = await params;
    const lookup = await getDraftProposalItem(id, itemId);

    if ("error" in lookup && lookup.error) {
      return lookup.error;
    }

    const { proposal } = lookup;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 },
      );
    }

    const title =
      "title" in body && typeof body.title === "string" ? body.title : undefined;
    const description =
      "description" in body
        ? body.description === null || typeof body.description === "string"
          ? body.description
          : undefined
        : null;
    const scheduledAtRaw =
      "scheduledAt" in body && typeof body.scheduledAt === "string"
        ? body.scheduledAt
        : undefined;
    const price =
      "price" in body && typeof body.price === "number" ? body.price : undefined;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (description === undefined) {
      return NextResponse.json(
        { error: "description must be a string or null" },
        { status: 400 },
      );
    }

    if (!scheduledAtRaw) {
      return NextResponse.json(
        { error: "scheduledAt is required" },
        { status: 400 },
      );
    }

    const scheduledAt = new Date(scheduledAtRaw);

    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { error: "scheduledAt must be a valid date" },
        { status: 400 },
      );
    }

    if (price === undefined) {
      return NextResponse.json({ error: "price is required" }, { status: 400 });
    }

    if (
      !isWithinReservationSchedule(
        scheduledAt,
        proposal.reservation.arrivalDate.toISOString(),
        proposal.reservation.departureDate.toISOString(),
      )
    ) {
      return NextResponse.json(
        {
          error: reservationScheduleErrorMessage(
            proposal.reservation.arrivalDate.toISOString(),
            proposal.reservation.departureDate.toISOString(),
          ),
        },
        { status: 400 },
      );
    }

    const item = await prisma.proposalItem.update({
      where: { id: itemId },
      data: {
        title,
        description,
        scheduledAt,
        price,
      },
    });

    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "Failed to update proposal item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId } = await params;
    const lookup = await getDraftProposalItem(id, itemId);

    if ("error" in lookup && lookup.error) {
      return lookup.error;
    }

    await prisma.proposalItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete proposal item" },
      { status: 500 },
    );
  }
}
