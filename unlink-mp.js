const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Borrando tokens de Mercado Pago...');
  const result = await prisma.driver.updateMany({
    where: {
      mpAccessToken: { not: null }
    },
    data: {
      mpAccessToken: null,
      mpRefreshToken: null,
      mpUserId: null
    }
  });
  console.log(`Desvinculadas ${result.count} cuentas exitosamente.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
