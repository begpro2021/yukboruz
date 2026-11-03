import { Router } from "express";
import { CargoStatus, TripStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

const router = Router();
const transitions: Record<TripStatus, TripStatus[]> = {
  [TripStatus.ASSIGNED]: [TripStatus.LOADING, TripStatus.CANCELLED],
  [TripStatus.LOADING]: [TripStatus.IN_TRANSIT, TripStatus.CANCELLED],
  [TripStatus.IN_TRANSIT]: [TripStatus.DELIVERED],
  [TripStatus.DELIVERED]: [],
  [TripStatus.CANCELLED]: [],
};
const progressByStatus: Record<TripStatus, number> = {
  [TripStatus.ASSIGNED]: 10,
  [TripStatus.LOADING]: 30,
  [TripStatus.IN_TRANSIT]: 70,
  [TripStatus.DELIVERED]: 100,
  [TripStatus.CANCELLED]: 0,
};

router.use(requireAuth);

router.get("/", asyncHandler(async (request, response) => {
  const user = request.user;
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi.");

  const where = user.role === UserRole.DISPATCHER
    ? {}
    : user.role === UserRole.FLEET
      ? { OR: [{ shipperId: user.id }, { carrierId: user.id }, { truck: { ownerId: user.id } }] }
      : { OR: [{ shipperId: user.id }, { carrierId: user.id }] };

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      cargo: true,
      shipper: { select: { id: true, name: true } },
      carrier: { select: { id: true, name: true } },
      bid: { select: { amountUzs: true } },
      truck: { select: { vehicle: true, plate: true } },
    },
  });
  response.json({ trips });
}));

router.patch("/:id/status", asyncHandler(async (request, response) => {
  const tripId = z.string().parse(request.params.id);
  const user = request.user;
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi.");
  const { status } = z.object({ status: z.nativeEnum(TripStatus) }).parse(request.body);
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { cargo: true, truck: true },
  });
  if (!trip) throw new HttpError(404, "Reys topilmadi.");

  const canUpdate = user.role === UserRole.DISPATCHER
    || trip.shipperId === user.id
    || trip.carrierId === user.id
    || (user.role === UserRole.FLEET && trip.truck?.ownerId === user.id);
  if (!canUpdate) throw new HttpError(403, "Bu reysni o'zgartirish huquqingiz yo'q.");
  if (!transitions[trip.status].includes(status)) {
    throw new HttpError(409, "Reys holatini bu bosqichga o'tkazib bo'lmaydi.");
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const claimedTrip = await transaction.trip.updateMany({
      where: { id: trip.id, status: trip.status },
      data: { status, progressPct: progressByStatus[status] },
    });
    if (claimedTrip.count !== 1) {
      throw new HttpError(409, "Reys holati boshqa so'rovda yangilangan.");
    }
    const updatedTrip = await transaction.trip.findUnique({
      where: { id: trip.id },
      include: {
        cargo: true,
        shipper: { select: { id: true, name: true } },
        carrier: { select: { id: true, name: true } },
        bid: { select: { amountUzs: true } },
        truck: { select: { vehicle: true, plate: true } },
      },
    });
    if (!updatedTrip) throw new HttpError(404, "Reys topilmadi.");
    if (status === TripStatus.DELIVERED) {
      await transaction.cargo.update({
        where: { id: trip.cargoId },
        data: { status: CargoStatus.COMPLETED },
      });
      if (trip.truckId) {
        await transaction.truck.update({
          where: { id: trip.truckId },
          data: { available: true },
        });
      }
    }
    if (status === TripStatus.CANCELLED) {
      await transaction.bid.update({
        where: { id: trip.bidId },
        data: { status: "REJECTED" },
      });
      await transaction.cargo.update({
        where: { id: trip.cargoId },
        data: { status: CargoStatus.OPEN },
      });
      if (trip.truckId) {
        await transaction.truck.update({
          where: { id: trip.truckId },
          data: { available: true },
        });
      }
    }
    return updatedTrip;
  });

  response.json({ trip: updated });
}));

export { router as tripsRouter };
