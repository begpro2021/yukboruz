CREATE TYPE "UserRole" AS ENUM ('SHIPPER', 'DRIVER', 'FLEET', 'DISPATCHER');
CREATE TYPE "CargoStatus" AS ENUM ('OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "DealMode" AS ENUM ('AUCTION', 'FIXED');
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "TripStatus" AS ENUM ('ASSIGNED', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cargo" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "cargoName" TEXT NOT NULL,
  "bodyType" TEXT NOT NULL,
  "weightTons" DOUBLE PRECISION NOT NULL,
  "volumeM3" DOUBLE PRECISION NOT NULL,
  "priceUzs" INTEGER NOT NULL,
  "dealMode" "DealMode" NOT NULL DEFAULT 'AUCTION',
  "status" "CargoStatus" NOT NULL DEFAULT 'OPEN',
  "loadingAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Truck" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "vehicle" TEXT NOT NULL,
  "plate" TEXT NOT NULL,
  "bodyType" TEXT NOT NULL,
  "capacityTons" DOUBLE PRECISION NOT NULL,
  "volumeM3" DOUBLE PRECISION NOT NULL,
  "currentCity" TEXT NOT NULL,
  "targetRoute" TEXT NOT NULL,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bid" (
  "id" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "truckId" TEXT,
  "amountUzs" INTEGER NOT NULL,
  "note" TEXT,
  "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Trip" (
  "id" TEXT NOT NULL,
  "cargoId" TEXT NOT NULL,
  "bidId" TEXT NOT NULL,
  "shipperId" TEXT NOT NULL,
  "carrierId" TEXT NOT NULL,
  "truckId" TEXT,
  "status" "TripStatus" NOT NULL DEFAULT 'ASSIGNED',
  "progressPct" INTEGER NOT NULL DEFAULT 10,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "Cargo_publicId_key" ON "Cargo"("publicId");
CREATE INDEX "Cargo_status_createdAt_idx" ON "Cargo"("status", "createdAt");
CREATE INDEX "Cargo_origin_destination_idx" ON "Cargo"("origin", "destination");
CREATE UNIQUE INDEX "Truck_publicId_key" ON "Truck"("publicId");
CREATE INDEX "Truck_bodyType_available_idx" ON "Truck"("bodyType", "available");
CREATE INDEX "Truck_currentCity_idx" ON "Truck"("currentCity");
CREATE INDEX "Bid_cargoId_status_idx" ON "Bid"("cargoId", "status");
CREATE INDEX "Bid_driverId_createdAt_idx" ON "Bid"("driverId", "createdAt");
CREATE INDEX "Trip_cargoId_idx" ON "Trip"("cargoId");
CREATE UNIQUE INDEX "Trip_bidId_key" ON "Trip"("bidId");
CREATE INDEX "Trip_shipperId_status_idx" ON "Trip"("shipperId", "status");
CREATE INDEX "Trip_carrierId_status_idx" ON "Trip"("carrierId", "status");

ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
