const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "conductores" ADD COLUMN IF NOT EXISTS "url_hoja_vida_conductor" TEXT;`);
    console.log("Columna url_hoja_vida_conductor añadida.");
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "conductores" ADD COLUMN IF NOT EXISTS "url_permiso_circulacion" TEXT;`);
    console.log("Columna url_permiso_circulacion añadida.");
    
    console.log("¡Hecho!");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
