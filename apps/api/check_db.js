const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to Supabase...");
    await prisma.$connect();
    console.log("Supabase Connection Successful!");
    
    const count = await prisma.user.count();
    console.log(`Total users in DB: ${count}`);
    
  } catch (error) {
    console.error("Supabase Connection Failed:");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
