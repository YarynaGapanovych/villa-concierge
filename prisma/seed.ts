import "dotenv/config";

import { createPrismaClient } from "../src/lib/create-prisma-client";

const prisma = createPrismaClient();

async function main() {
  const member = await prisma.member.create({
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
  });

  console.log("Seeded member:", member);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
