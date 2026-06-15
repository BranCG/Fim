-- DropTable
DROP TABLE IF EXISTS "ratings" CASCADE;
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "safety_reports" CASCADE;
DROP TABLE IF EXISTS "system_configs" CASCADE;
DROP TABLE IF EXISTS "trips" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "drivers" CASCADE;

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "rut" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "direccion" TEXT,
    "url_carnet_frente" TEXT,
    "url_carnet_dorso" TEXT,
    "url_certificado_antecedentes" TEXT,
    "esta_verificado" BOOLEAN NOT NULL DEFAULT false,
    "correo_verificado" BOOLEAN NOT NULL DEFAULT true,
    "codigo_correo" TEXT,
    "codigo_restablecer" TEXT,
    "expiracion_codigo_restablecer" TIMESTAMP(3),
    "metodo_pago" TEXT,
    "token_tarjeta_mp" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'passenger',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "url_selfie" TEXT,
    "token_fcm" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conductores" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,
    "direccion" TEXT NOT NULL,
    "url_carnet_frente" TEXT NOT NULL,
    "url_carnet_dorso" TEXT NOT NULL,
    "url_certificado_antecedentes" TEXT,
    "url_selfie" TEXT,
    "numero_licencia" TEXT NOT NULL,
    "url_licencia_frente" TEXT NOT NULL,
    "url_licencia_dorso" TEXT NOT NULL DEFAULT '',
    "marca_vehiculo" TEXT NOT NULL,
    "modelo_vehiculo" TEXT NOT NULL,
    "anio_vehiculo" INTEGER NOT NULL,
    "patente_vehiculo" TEXT NOT NULL,
    "color_vehiculo" TEXT NOT NULL DEFAULT '',
    "url_foto_vehiculo" TEXT NOT NULL,
    "numero_tag" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pending',
    "membresia_pagada" BOOLEAN NOT NULL DEFAULT false,
    "plan_membresia" TEXT NOT NULL DEFAULT 'BLACK',
    "progreso_membresia" INTEGER NOT NULL DEFAULT 0,
    "meta_membresia" INTEGER NOT NULL DEFAULT 150000,
    "viajes_efectivo_diarios" INTEGER NOT NULL DEFAULT 0,
    "deuda_comfort" INTEGER NOT NULL DEFAULT 0,
    "ultimo_pago_comfort" TIMESTAMP(3),
    "inicio_semana_membresia" TIMESTAMP(3),
    "fecha_membresia" TIMESTAMP(3),
    "id_suscripcion_mp" TEXT,
    "expiracion_membresia" TIMESTAMP(3),
    "url_comprobante_comfort" TEXT,
    "saldo_billetera" INTEGER NOT NULL DEFAULT 0,
    "notas_administrador" TEXT,
    "enlace_mercado_pago" TEXT,
    "esta_en_linea" BOOLEAN NOT NULL DEFAULT false,
    "ultima_latitud" DOUBLE PRECISION,
    "ultima_longitud" DOUBLE PRECISION,
    "ultima_conexion" TIMESTAMP(3),
    "calificacion_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viajes_totales" INTEGER NOT NULL DEFAULT 0,
    "correo_verificado" BOOLEAN NOT NULL DEFAULT true,
    "codigo_correo" TEXT,
    "codigo_restablecer" TEXT,
    "expiracion_codigo_restablecer" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "token_fcm" TEXT,

    CONSTRAINT "conductores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viajes" (
    "id" TEXT NOT NULL,
    "id_pasajero" TEXT NOT NULL,
    "id_conductor" TEXT,
    "latitud_origen" DOUBLE PRECISION NOT NULL,
    "longitud_origen" DOUBLE PRECISION NOT NULL,
    "direccion_origen" TEXT NOT NULL,
    "latitud_destino" DOUBLE PRECISION NOT NULL,
    "longitud_destino" DOUBLE PRECISION NOT NULL,
    "direccion_destino" TEXT NOT NULL,
    "distancia_km" DOUBLE PRECISION NOT NULL,
    "duracion_min" INTEGER NOT NULL,
    "precio_estimado" INTEGER NOT NULL,
    "precio_final" INTEGER,
    "tiene_descuento" BOOLEAN NOT NULL DEFAULT false,
    "metodo_pago" TEXT NOT NULL,
    "esta_pagado" BOOLEAN NOT NULL DEFAULT false,
    "estado_pago" TEXT NOT NULL DEFAULT 'pending',
    "codigo_otp" TEXT,
    "codigo_otp_destino" TEXT,
    "id_pago_mp" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'searching',
    "cantidad_pasajeros" INTEGER NOT NULL DEFAULT 1,
    "cancelado_por" TEXT,
    "motivo_cancelacion" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_aceptacion" TIMESTAMP(3),
    "fecha_llegada_conductor" TIMESTAMP(3),
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "fecha_cancelacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificaciones" (
    "id" TEXT NOT NULL,
    "id_viaje" TEXT NOT NULL,
    "id_pasajero" TEXT NOT NULL,
    "id_conductor" TEXT NOT NULL,
    "puntaje_conductor" INTEGER NOT NULL,
    "comentario_conductor" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_refresco" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "id_usuario" TEXT,
    "id_conductor" TEXT,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_refresco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones_sistema" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_sistema_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "reportes_seguridad" (
    "id" TEXT NOT NULL,
    "id_viaje" TEXT NOT NULL,
    "id_reportador" TEXT NOT NULL,
    "rol_reportador" TEXT NOT NULL,
    "id_reportado" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descripcion" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "esta_resuelto" BOOLEAN NOT NULL DEFAULT false,
    "notas_administrador" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_seguridad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefono_key" ON "usuarios"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_rut_key" ON "usuarios"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "conductores_correo_key" ON "conductores"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "conductores_telefono_key" ON "conductores"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "conductores_rut_key" ON "conductores"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "conductores_patente_vehiculo_key" ON "conductores"("patente_vehiculo");

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_id_viaje_key" ON "calificaciones"("id_viaje");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_refresco_token_key" ON "tokens_refresco"("token");

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "conductores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_pasajero_fkey" FOREIGN KEY ("id_pasajero") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_conductor_fkey" FOREIGN KEY ("id_conductor") REFERENCES "conductores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_pasajero_fkey" FOREIGN KEY ("id_pasajero") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_seguridad" ADD CONSTRAINT "reportes_seguridad_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
