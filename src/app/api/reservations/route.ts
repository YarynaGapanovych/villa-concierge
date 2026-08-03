import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { arrivalDate: "asc" },
      include: {
        member: {
          select: {
            name: true,
            email: true,
          },
        },
        proposals: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            sentAt: true,
            items: {
              select: {
                price: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(reservations);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 },
    );
  }
}
