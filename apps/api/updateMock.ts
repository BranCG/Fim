import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.driver.update({
    where: { email: 'conductor1@fim.cl' },
    data: { status: 'approved', membershipPaid: false }
  });
  console.log('Driver conductor1@fim.cl actualizado a approved y sin pagar');
}
main().catch(console.error).finally(() => prisma.$disconnect());
