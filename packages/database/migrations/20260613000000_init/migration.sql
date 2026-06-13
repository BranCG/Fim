-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rut" TEXT,
    "birthDate" TIMESTAMP(3),
    "address" TEXT,
    "idFrontUrl" TEXT,
    "idBackUrl" TEXT,
    "backgroundDocUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT true,
    "emailCode" TEXT,
    "resetCode" TEXT,
    "resetCodeExpires" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "mpCardToken" TEXT,
    "role" TEXT NOT NULL DEFAULT 'passenger',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "selfieUrl" TEXT,
    "fcmToken" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "idFrontUrl" TEXT NOT NULL,
    "idBackUrl" TEXT NOT NULL,
    "backgroundDocUrl" TEXT,
    "selfieUrl" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "licenseUrl" TEXT NOT NULL,
    "licenseBackUrl" TEXT NOT NULL DEFAULT '',
    "vehicleBrand" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleYear" INTEGER NOT NULL,
    "vehiclePlate" TEXT NOT NULL,
    "vehiclePhotoUrl" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "membershipPaid" BOOLEAN NOT NULL DEFAULT false,
    "membershipPlan" TEXT NOT NULL DEFAULT 'BLACK',
    "membershipProgress" INTEGER NOT NULL DEFAULT 0,
    "membershipGoal" INTEGER NOT NULL DEFAULT 150000,
    "dailyCashTripsCount" INTEGER NOT NULL DEFAULT 0,
    "comfortDebt" INTEGER NOT NULL DEFAULT 0,
    "comfortLastPaidAt" TIMESTAMP(3),
    "membershipWeekStart" TIMESTAMP(3),
    "membershipDate" TIMESTAMP(3),
    "mpSubscriptionId" TEXT,
    "membershipExpiresAt" TIMESTAMP(3),
    "comfortReceiptUrl" TEXT,
    "walletBalance" INTEGER NOT NULL DEFAULT 0,
    "adminNotes" TEXT,
    "mercadoPagoLink" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastLat" DOUBLE PRECISION,
    "lastLng" DOUBLE PRECISION,
    "lastSeen" TIMESTAMP(3),
    "totalRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "bankAccountType" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountName" TEXT,
    "bankAccountRut" TEXT,
    "bankAccountEmail" TEXT,
    "taxCompliant" BOOLEAN NOT NULL DEFAULT true,
    "taxDocumentUrl" TEXT,
    "taxPendingReview" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT true,
    "emailCode" TEXT,
    "resetCode" TEXT,
    "resetCodeExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fcmToken" TEXT,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "driverId" TEXT,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "originAddress" TEXT NOT NULL,
    "destLat" DOUBLE PRECISION NOT NULL,
    "destLng" DOUBLE PRECISION NOT NULL,
    "destAddress" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "estimatedPrice" INTEGER NOT NULL,
    "finalPrice" INTEGER,
    "isDiscounted" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "otpCode" TEXT,
    "dropoffOtpCode" TEXT,
    "mpPaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'searching',
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "driverArrivedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverScore" INTEGER NOT NULL,
    "driverComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "driverId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_rut_key" ON "users"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "drivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_phone_key" ON "drivers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_rut_key" ON "drivers"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_vehiclePlate_key" ON "drivers"("vehiclePlate");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_tripId_key" ON "ratings"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
