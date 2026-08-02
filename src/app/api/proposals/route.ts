import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reservation: {
          select: {
            destination: true,
            villa: true,
            member: {
              select: {
                name: true,
              },
            },
          },
        },
        items: true,
      },
    });

    return NextResponse.json(proposals);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const reservationId =
      typeof body === "object" &&
      body !== null &&
      "reservationId" in body &&
      typeof body.reservationId === "string"
        ? body.reservationId
        : undefined;

    if (!reservationId) {
      return NextResponse.json(
        { error: "reservationId is required" },
        { status: 400 },
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    const proposal = await prisma.proposal.create({
      data: {
        reservationId,
        status: "draft",
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 },
    );
  }
}
