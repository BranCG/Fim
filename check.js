const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const trips = await prisma.trip.findMany({
    where: { 
      status: 'completed', 
      rating: { is: null }
    }
  });
  console.log(trips);
}

check().finally(() => prisma.$disconnect());
