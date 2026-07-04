import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const drivers = await prisma.driver.findMany({ take: 5, select: { email: true, name: true, status: true, membershipPaid: true } });
  console.log(drivers);
}
main().catch(console.error).finally(() => prisma.$disconnect());
