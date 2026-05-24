const { PrismaClient } = require('@prisma/client');

async function check(url) {
  console.log('Checking:', url);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });
  try {
    const drivers = await prisma.driver.findMany({ take: 1 });
    console.log('SUCCESS. First driver:', drivers[0]?.email);
  } catch (err) {
    console.log('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await check('file:C:/Users/acer/.gemini/antigravity/scratch/fim-app/apps/api/fim.db');
  await check('file:C:/Users/acer/.gemini/antigravity/scratch/fim-app/packages/database/fim.db');
}
main();
