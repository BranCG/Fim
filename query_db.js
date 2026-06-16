const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/api/.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Connecting to database:', process.env.DATABASE_URL?.split('@')[1] || 'undefined');
  try {
    const ratings = await prisma.rating.findMany({
      include: {
        passenger: { select: { name: true } },
        driver: { select: { name: true } }
      }
    });
    console.log(`Found ${ratings.length} ratings:`);
    console.log(JSON.stringify(ratings, null, 2));

    const drivers = await prisma.driver.findMany({
      select: { id: true, name: true, totalRating: true, topQualities: true, totalTrips: true }
    });
    console.log(`Found ${drivers.length} drivers:`);
    console.log(JSON.stringify(drivers, null, 2));
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
