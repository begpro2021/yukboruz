import { CargoStatus, DealMode, Prisma, UserRole } from "@prisma/client";
import { Router } from "express";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

const router = Router();

const cargoSchema = z.object({
  origin: z.string().trim().min(2).max(120),
  destination: z.string().trim().min(2).max(120),
  cargoName: z.string().trim().min(2).max(160),
  bodyType: z.string().trim().min(2).max(60),
  weightTons: z.number().positive().max(100),
  volumeM3: z.number().positive().max(200),
  priceUzs: z.number().int().positive().max(2_000_000_000),
  dealMode: z.nativeEnum(DealMode).default(DealMode.AUCTION),
  loadingAt: z.string().datetime().optional(),
});

const bidSchema = z.object({
  amountUzs: z.number().int().positive().max(2_000_000_000),
  note: z.string().trim().max(500).optional(),
  truckId: z.string().optional(),
});

router.use(requireAuth);

router.get("/", asyncHandler(async (request, response) => {
  const search = z.string().trim().max(100).optional().parse(request.query.q);
  const origin = z.string().trim().max(120).optional().parse(request.query.origin);
  const destination = z.string().trim().max(120).optional().parse(request.query.destination);
  const bodyType = z.string().trim().max(60).optional().parse(request.query.bodyType);
  const requestedStatus = z.nativeEnum(CargoStatus).optional().parse(request.query.status);

  const where: Prisma.CargoWhereInput = {
    ...(requestedStatus ? { status: requestedStatus } : { status: { not: CargoStatus.CANCELLED } }),
    ...(origin ? { origin: { contains: origin, mode: "insensitive" } } : {}),
    ...(destination ? { destination: { contains: destination, mode: "insensitive" } } : {}),
    ...(bodyType ? { bodyType: { equals: bodyType, mode: "insensitive" } } : {}),
    ...(search
      ? {
          OR: [
            { publicId: { contains: search, mode: "insensitive" } },
            { origin: { contains: search, mode: "insensitive" } },
            { destination: { contains: search, mode: "insensitive" } },
            { cargoName: { contains: search, mode: "insensitive" } },
            { bodyType: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const cargos = await prisma.cargo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { id: true, name: true, role: true } },
      bids: {
        orderBy: { createdAt: "desc" },
        include: {
          driver: { select: { id: true, name: true } },
          truck: { select: { id: true, vehicle: true, plate: true, bodyType: true } },
        },
      },
    },
  });
  response.json({ cargos });
}));

router.post("/", requireRoles(UserRole.SHIPPER, UserRole.FLEET, UserRole.DISPATCHER), asyncHandler(async (request, response) => {
  const input = cargoSchema.parse(request.body);
  const user = request.user;
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi.");

  const cargo = await prisma.cargo.create({
    data: {
      ...input,
      loadingAt: input.loadingAt ? new Date(input.loadingAt) : null,
      ownerId: user.id,
      publicId: `YUK-${Date.now()}-${randomInt(100, 999)}`,
    },
    include: { owner: { select: { id: true, name: true, role: true } }, bids: true },
  });
  response.status(201).json({ cargo });
}));

router.post("/:id/bids", requireRoles(UserRole.DRIVER, UserRole.FLEET, UserRole.DISPATCHER), asyncHandler(async (request, response) => {
  const input = bidSchema.parse(request.body);
  const cargoId = z.string().parse(request.params.id);
  const user = request.user;
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi.");

  const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!cargo) throw new HttpError(404, "Yuk e'loni topilmadi.");
  if (cargo.ownerId === user.id) throw new HttpError(403, "O'z e'loningizga taklif bera olmaysiz.");
  if (cargo.status !== CargoStatus.OPEN) throw new HttpError(409, "Bu yuk uchun taklif qabul qilinmayapti.");
  if (cargo.dealMode === DealMode.FIXED && input.amountUzs !== cargo.priceUzs) {
    throw new HttpError(400, "Qat'iy narxli yuk uchun ko'rsatilgan narxni yuboring.");
  }

  let truckId: string | null = null;
  if (input.truckId) {
    const truck = await prisma.truck.findFirst({
      where: { id: input.truckId, ownerId: user.id, available: true },
      select: { id: true },
    });
    if (!truck) throw new HttpError(400, "Tanlangan transport sizga tegishli emas yoki band.");
    truckId = truck.id;
  }

  const bid = await prisma.bid.create({
    data: {
      cargoId: cargo.id,
      driverId: user.id,
      truckId,
      amountUzs: input.amountUzs,
      note: input.note || null,
    },
    include: {
      driver: { select: { id: true, name: true } },
      truck: { select: { id: true, vehicle: true, plate: true } },
    },
  });
  response.status(201).json({ bid });
}));

router.post("/:id/bids/:bidId/accept", requireRoles(UserRole.SHIPPER, UserRole.FLEET, UserRole.DISPATCHER), asyncHandler(async (request, response) => {
  const cargoId = z.string().parse(request.params.id);
  const bidId = z.string().parse(request.params.bidId);
  const user = request.user;
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi.");

  const trip = await prisma.$transaction(async (transaction) => {
    const cargo = await transaction.cargo.findUnique({ where: { id: cargoId } });
    if (!cargo) throw new HttpError(404, "Yuk e'loni topilmadi.");
    if (cargo.ownerId !== user.id) throw new HttpError(403, "Faqat e'lon egasi taklifni tanlay oladi.");
    if (cargo.status !== CargoStatus.OPEN) throw new HttpError(409, "Yuk allaqachon band qilingan yoki yopilgan.");

    const bid = await transaction.bid.findFirst({
      where: { id: bidId, cargoId: cargo.id, status: "PENDING" },
      include: { truck: true },
    });
    if (!bid) throw new HttpError(404, "Faol taklif topilmadi.");
    const assignedCargo = await transaction.cargo.updateMany({
      where: { id: cargo.id, status: CargoStatus.OPEN },
      data: { status: CargoStatus.ASSIGNED },
    });
    if (assignedCargo.count !== 1) {
      throw new HttpError(409, "Yuk boshqa taklif bilan band qilingan.");
    }

    await transaction.bid.updateMany({
      where: { cargoId: cargo.id, status: "PENDING" },
      data: { status: "REJECTED" },
    });
    await transaction.bid.update({ where: { id: bid.id }, data: { status: "ACCEPTED" } });

    if (bid.truckId) {
      const reservedTruck = await transaction.truck.updateMany({
        where: { id: bid.truckId, available: true },
        data: { available: false },
      });
      if (reservedTruck.count !== 1) {
        throw new HttpError(409, "Tanlangan transport boshqa reysga band qilingan.");
      }
    }

    return transaction.trip.create({
      data: {
        cargoId: cargo.id,
        bidId: bid.id,
        shipperId: cargo.ownerId,
        carrierId: bid.driverId,
        truckId: bid.truckId,
      },
      include: {
        cargo: true,
        bid: { include: { driver: { select: { id: true, name: true } }, truck: true } },
      },
    });
  });

  response.status(201).json({ trip });
}));

router.patch("/:id", asyncHandler(async (request, response) => {
  const cargoId = z.string().parse(request.params.id);
  const user = request.user;
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi.");
  const input = z.object({
    status: z.enum([CargoStatus.OPEN, CargoStatus.CANCELLED]),
  }).parse(request.body);

  const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!cargo) throw new HttpError(404, "Yuk e'loni topilmadi.");
  if (cargo.ownerId !== user.id) throw new HttpError(403, "Faqat e'lon egasi uni o'zgartira oladi.");
  if (cargo.status === CargoStatus.ASSIGNED || cargo.status === CargoStatus.COMPLETED) {
    throw new HttpError(409, "Band qilingan yoki yakunlangan yukni o'zgartirib bo'lmaydi.");
  }

  const updated = await prisma.cargo.update({
    where: { id: cargo.id },
    data: { status: input.status },
  });
  response.json({ cargo: updated });
}));

router.get("/:id", asyncHandler(async (request, response) => {
  const cargoId = z.string().parse(request.params.id);
  const cargo = await prisma.cargo.findUnique({
    where: { id: cargoId },
    include: {
      owner: { select: { id: true, name: true, role: true } },
      bids: {
        orderBy: { createdAt: "desc" },
        include: {
          driver: { select: { id: true, name: true } },
          truck: { select: { id: true, vehicle: true, plate: true, bodyType: true } },
        },
      },
    },
  });
  if (!cargo) throw new HttpError(404, "Yuk e'loni topilmadi.");
  response.json({ cargo });
}));

export { router as cargosRouter };
