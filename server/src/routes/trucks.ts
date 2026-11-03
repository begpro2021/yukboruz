import { Router } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

const router = Router();

const truckSchema = z.object({
  vehicle: z.string().trim().min(2).max(100),
  plate: z.string().trim().min(3).max(20),
  bodyType: z.string().trim().min(2).max(60),
  capacityTons: z.number().positive().max(100),
  volumeM3: z.number().positive().max(200),
  currentCity: z.string().trim().min(2).max(120),
  targetRoute: z.string().trim().min(2).max(160),
});

router.use(requireAuth);

router.get("/", asyncHandler(async (request, response) => {
  const search = z.string().trim().max(100).optional().parse(request.query.q);
  const bodyType = z.string().trim().max(60).optional().parse(request.query.bodyType);
  const trucks = await prisma.truck.findMany({
    where: {
      ...(request.query.available === "true" ? { available: true } : {}),
      ...(bodyType ? { bodyType: { equals: bodyType, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { vehicle: { contains: search, mode: "insensitive" } },
              { plate: { contains: search, mode: "insensitive" } },
              { currentCity: { contains: search, mode: "insensitive" } },
              { targetRoute: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { owner: { select: { id: true, name: true, role: true } } },
  });
  response.json({ trucks });
}));

router.post("/", requireRoles(UserRole.DRIVER, UserRole.FLEET), asyncHandler(async (request, response) => {
  const input = truckSchema.parse(request.body);
  const user = request.user;
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi.");
  const truck = await prisma.truck.create({
    data: { ...input, ownerId: user.id, publicId: `TRK-${Date.now()}` },
    include: { owner: { select: { id: true, name: true, role: true } } },
  });
  response.status(201).json({ truck });
}));

router.patch("/:id", asyncHandler(async (request, response) => {
  const truckId = z.string().parse(request.params.id);
  const user = request.user;
  if (!user) throw new HttpError(401, "Tizimga kirish talab qilinadi.");
  const input = z.object({ available: z.boolean() }).parse(request.body);
  const truck = await prisma.truck.findUnique({ where: { id: truckId } });
  if (!truck) throw new HttpError(404, "Transport e'loni topilmadi.");
  if (truck.ownerId !== user.id) throw new HttpError(403, "Faqat transport egasi uni o'zgartira oladi.");
  if (!truck.available && input.available) {
    const activeTrip = await prisma.trip.findFirst({
      where: { truckId: truck.id, status: { in: ["ASSIGNED", "LOADING", "IN_TRANSIT"] } },
      select: { id: true },
    });
    if (activeTrip) throw new HttpError(409, "Faol reysdagi transportni bo'sh deb belgilab bo'lmaydi.");
  }
  const updated = await prisma.truck.update({ where: { id: truck.id }, data: input });
  response.json({ truck: updated });
}));

export { router as trucksRouter };
