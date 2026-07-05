const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const result = await prisma.trip.updateMany({
    where: { 
      status: 'completed', 
      rating: { is: null },
      driverId: null
    },
    data: {
      status: 'cancelled',
      cancelReason: 'Corregido por el sistema (Sin conductor)'
    }
  });
  console.log('Viajes fantasma corregidos:', result.count);
}

fix().finally(() => prisma.$disconnect());
