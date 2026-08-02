import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.status !== "draft") {
      return NextResponse.json(
        { error: "Items can only be added to draft proposals" },
        { status: 400 },
      );
    }

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

    const category =
      "category" in body && typeof body.category === "string"
        ? body.category
        : undefined;
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

    if (!category) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 },
      );
    }

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

    const item = await prisma.proposalItem.create({
      data: {
        proposalId: id,
        category,
        title,
        description,
        scheduledAt,
        price,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create proposal item" },
      { status: 500 },
    );
  }
}
