import "dotenv/config";

import { createPrismaClient } from "../src/lib/create-prisma-client";

const prisma = createPrismaClient();

async function main() {
  await prisma.sentEmail.deleteMany();
  await prisma.proposalItem.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.member.deleteMany();

  const members = await Promise.all([
    prisma.member.create({
      data: {
        name: "James Whitfield",
        email: "james.whitfield@example.com",
        reservations: {
          create: {
            destination: "Mexico",
            villa: "Villa Punta Mita",
            arrivalDate: new Date("2026-03-15"),
            departureDate: new Date("2026-03-22"),
          },
        },
      },
      include: { reservations: true },
    }),
    prisma.member.create({
      data: {
        name: "Elena Vasquez",
        email: "elena.vasquez@example.com",
        reservations: {
          create: {
            destination: "Italy",
            villa: "Villa Amalfi",
            arrivalDate: new Date("2026-06-10"),
            departureDate: new Date("2026-06-17"),
          },
        },
      },
      include: { reservations: true },
    }),
    prisma.member.create({
      data: {
        name: "Marcus Chen",
        email: "marcus.chen@example.com",
        reservations: {
          create: {
            destination: "Caribbean",
            villa: "Villa St. Barts",
            arrivalDate: new Date("2026-12-01"),
            departureDate: new Date("2026-12-08"),
          },
        },
      },
      include: { reservations: true },
    }),
  ]);

  console.log("Seeded members:", members);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
