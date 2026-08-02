import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["draft", "sent", "approved", "paid"] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: string): value is ValidStatus {
  return VALID_STATUSES.includes(value as ValidStatus);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            member: true,
          },
        },
        items: {
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch proposal" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    const payload = body as Record<string, unknown>;
    const hasStatus = "status" in payload;
    const hasNotes = "notes" in payload;

    if (!hasStatus && !hasNotes) {
      return NextResponse.json(
        { error: "At least one of status or notes is required" },
        { status: 400 },
      );
    }

    const data: { status?: ValidStatus; notes?: string | null } = {};

    if (hasStatus) {
      if (
        typeof payload.status !== "string" ||
        !isValidStatus(payload.status)
      ) {
        return NextResponse.json(
          {
            error:
              "status must be one of draft, sent, approved, or paid",
          },
          { status: 400 },
        );
      }

      data.status = payload.status;
    }

    if (hasNotes) {
      if (payload.notes !== null && typeof payload.notes !== "string") {
        return NextResponse.json(
          { error: "notes must be a string or null" },
          { status: 400 },
        );
      }

      data.notes = payload.notes as string | null;
    }

    const existing = await prisma.proposal.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data,
      include: {
        items: {
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    return NextResponse.json(proposal);
  } catch {
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 },
    );
  }
}
