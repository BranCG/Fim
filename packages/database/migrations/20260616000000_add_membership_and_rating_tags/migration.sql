-- AlterTable
ALTER TABLE "conductores" ADD COLUMN "mejores_cualidades" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "conductores" ADD COLUMN "es_prueba" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "conductores" ADD COLUMN "siguiente_descuento" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "calificaciones" ADD COLUMN "etiquetas" TEXT[] NOT NULL DEFAULT '{}';
