import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reservation = await prisma.reservation.findFirst({
      include: {
        member: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "No reservation found" },
        { status: 404 },
      );
    }

    return NextResponse.json(reservation);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch reservation" },
      { status: 500 },
    );
  }
}
