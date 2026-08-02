import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.status !== "draft") {
      return NextResponse.json(
        { error: "Items can only be removed from draft proposals" },
        { status: 400 },
      );
    }

    const item = await prisma.proposalItem.findFirst({
      where: { id: itemId, proposalId: id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
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
