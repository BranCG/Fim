const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT pid, query, state, cast(age(clock_timestamp(), query_start) as text) AS age
      FROM pg_stat_activity
      WHERE query NOT LIKE '%pg_stat_activity%';
    `);
    console.log('Active queries in Postgres:');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error running raw query:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
