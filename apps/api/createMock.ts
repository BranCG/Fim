import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const driver = await prisma.driver.create({
    data: {
      name: 'Conductor Prueba Pago',
      email: 'pago.prueba@fim.cl',
      phone: '+56900000000',
      password: 'hash',
      status: 'approved',
      membershipPaid: false,
      membershipPlan: 'BLACK'
    }
  });
  console.log('Creado:', driver.email);
}
main().catch(console.error).finally(() => prisma.$disconnect());
