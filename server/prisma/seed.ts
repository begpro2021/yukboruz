import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  BidStatus,
  CargoStatus,
  DealMode,
  PrismaClient,
  TripStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("Demo1234!", 12);

async function seed() {
  const shipper = await prisma.user.upsert({
    where: { phone: "+998900000001" },
    update: { name: "Oltin Vodiy Logistika", role: UserRole.SHIPPER, passwordHash },
    create: {
      phone: "+998900000001",
      name: "Oltin Vodiy Logistika",
      role: UserRole.SHIPPER,
      passwordHash,
    },
  });
  const driver = await prisma.user.upsert({
    where: { phone: "+998900000002" },
    update: { name: "Rustamjon Ahmedov", role: UserRole.DRIVER, passwordHash },
    create: {
      phone: "+998900000002",
      name: "Rustamjon Ahmedov",
      role: UserRole.DRIVER,
      passwordHash,
    },
  });
  const fleet = await prisma.user.upsert({
    where: { phone: "+998900000003" },
    update: { name: "Karvon Logistika", role: UserRole.FLEET, passwordHash },
    create: {
      phone: "+998900000003",
      name: "Karvon Logistika",
      role: UserRole.FLEET,
      passwordHash,
    },
  });
  await prisma.user.upsert({
    where: { phone: "+998900000004" },
    update: { name: "Sardor Broker", role: UserRole.DISPATCHER, passwordHash },
    create: {
      phone: "+998900000004",
      name: "Sardor Broker",
      role: UserRole.DISPATCHER,
      passwordHash,
    },
  });

  const volvo = await prisma.truck.upsert({
    where: { publicId: "TRK-DEMO-101" },
    update: {},
    create: {
      publicId: "TRK-DEMO-101",
      ownerId: driver.id,
      vehicle: "Volvo FH 460",
      plate: "01 A 777 AA",
      bodyType: "Tent",
      capacityTons: 22,
      volumeM3: 92,
      currentCity: "Toshkent, Sergeli",
      targetRoute: "Andijon / Farg'ona / Namangan",
      available: false,
    },
  });
  await prisma.truck.upsert({
    where: { publicId: "TRK-DEMO-102" },
    update: {},
    create: {
      publicId: "TRK-DEMO-102",
      ownerId: fleet.id,
      vehicle: "DAF XF 105",
      plate: "30 Z 550 BB",
      bodyType: "Refrijerator",
      capacityTons: 21,
      volumeM3: 86,
      currentCity: "Samarqand, Jomboy",
      targetRoute: "Toshkent / Olmaota",
    },
  });

  const activeCargo = await prisma.cargo.upsert({
    where: { publicId: "YUK-DEMO-8492" },
    update: {},
    create: {
      publicId: "YUK-DEMO-8492",
      ownerId: shipper.id,
      origin: "Toshkent, Sergeli sanoat zonasi",
      destination: "Andijon, Shimoliy sanoat hududi",
      cargoName: "Qurilish materiallari",
      bodyType: "Tent",
      weightTons: 22,
      volumeM3: 92,
      priceUzs: 5_400_000,
      dealMode: DealMode.AUCTION,
      status: CargoStatus.ASSIGNED,
    },
  });
  const openCargo = await prisma.cargo.upsert({
    where: { publicId: "YUK-DEMO-8495" },
    update: {},
    create: {
      publicId: "YUK-DEMO-8495",
      ownerId: shipper.id,
      origin: "Samarqand, Jomboy",
      destination: "Olmaota, Qozog'iston",
      cargoName: "Muzlatilgan meva-sabzavot",
      bodyType: "Refrijerator",
      weightTons: 20.5,
      volumeM3: 86,
      priceUzs: 16_800_000,
      dealMode: DealMode.AUCTION,
      loadingAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await prisma.cargo.upsert({
    where: { publicId: "YUK-DEMO-8499" },
    update: {},
    create: {
      publicId: "YUK-DEMO-8499",
      ownerId: fleet.id,
      origin: "Navoiy, Erkin iqtisodiy zona",
      destination: "Buxoro, Qorovulbozor",
      cargoName: "Sanoat uskunalari",
      bodyType: "Tral",
      weightTons: 38,
      volumeM3: 65,
      priceUzs: 6_200_000,
      dealMode: DealMode.FIXED,
    },
  });

  const acceptedBid = await prisma.bid.findFirst({
    where: { cargoId: activeCargo.id, driverId: driver.id },
  });
  const bid = acceptedBid
    ? await prisma.bid.update({
        where: { id: acceptedBid.id },
        data: { amountUzs: 4_850_000, status: BidStatus.ACCEPTED, truckId: volvo.id },
      })
    : await prisma.bid.create({
        data: {
          cargoId: activeCargo.id,
          driverId: driver.id,
          truckId: volvo.id,
          amountUzs: 4_850_000,
          status: BidStatus.ACCEPTED,
          note: "Sergelidan yo'lga chiqishga tayyor.",
        },
      });

  const secondBid = await prisma.bid.findFirst({
    where: { cargoId: openCargo.id, driverId: driver.id },
  });
  const secondBidData = {
    cargoId: openCargo.id,
    driverId: driver.id,
    truckId: null,
    amountUzs: 16_200_000,
    note: "TIR hujjatlari tayyor.",
    status: BidStatus.PENDING,
  } as const;
  if (secondBid) {
    await prisma.bid.update({
      where: { id: secondBid.id },
      data: {
        truckId: null,
        amountUzs: secondBidData.amountUzs,
        note: secondBidData.note,
        status: BidStatus.PENDING,
      },
    });
  } else {
    await prisma.bid.create({
      data: secondBidData,
    });
  }

  const tripData = {
    bidId: bid.id,
    shipperId: shipper.id,
    carrierId: driver.id,
    truckId: volvo.id,
    status: TripStatus.IN_TRANSIT,
    progressPct: 70,
  } as const;
  const existingTrip = await prisma.trip.findFirst({
    where: { cargoId: activeCargo.id },
    select: { id: true },
  });
  if (existingTrip) {
    await prisma.trip.update({
      where: { id: existingTrip.id },
      data: tripData,
    });
  } else {
    await prisma.trip.create({
      data: {
        cargoId: activeCargo.id,
        ...tripData,
      },
    });
  }

  console.log("Seeded 4 demo accounts, 3 cargo listings, 2 trucks, bids, and 1 trip.");
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
