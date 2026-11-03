import { Router } from "express";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { asyncHandler } from "../lib/async-handler.js";
import { normalizePhone } from "../lib/phone.js";

const router = Router();

const credentialsSchema = z.object({
  phone: z.string().trim().min(9).max(20),
  password: z.string().min(8).max(128),
});

const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80),
  role: z.enum([UserRole.SHIPPER, UserRole.DRIVER, UserRole.FLEET]),
});

function publicUser(user: {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
}) {
  return { id: user.id, phone: user.phone, name: user.name, role: user.role };
}

function saveSession(request: Express.Request) {
  return new Promise<void>((resolve, reject) => {
    request.session.save((error) => (error ? reject(error) : resolve()));
  });
}

router.post("/register", asyncHandler(async (request, response) => {
  const input = registrationSchema.parse(request.body);
  const phone = normalizePhone(input.phone);
  const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
  if (existing) throw new HttpError(409, "Bu telefon raqami bilan profil mavjud.");

  const user = await prisma.user.create({
    data: {
      phone,
      name: input.name,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, 12),
    },
    select: { id: true, phone: true, name: true, role: true },
  });

  request.session.userId = user.id;
  await saveSession(request);
  response.status(201).json({ user: publicUser(user) });
}));

router.post("/login", asyncHandler(async (request, response) => {
  const input = credentialsSchema.parse(request.body);
  const phone = normalizePhone(input.phone);
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, "Telefon raqami yoki parol noto'g'ri.");
  }

  await new Promise<void>((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
  request.session.userId = user.id;
  await saveSession(request);
  response.json({ user: publicUser(user) });
}));

router.post("/logout", asyncHandler(async (request, response) => {
  if (!request.session.userId) {
    response.status(204).end();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    request.session.destroy((error) => (error ? reject(error) : resolve()));
  });
  response.clearCookie("yukbor.sid", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.status(204).end();
}));

router.get("/me", asyncHandler(async (request, response) => {
  if (!request.session.userId) throw new HttpError(401, "Tizimga kirish talab qilinadi.");
  const user = await prisma.user.findUnique({
    where: { id: request.session.userId },
    select: { id: true, phone: true, name: true, role: true },
  });
  if (!user) throw new HttpError(401, "Sessiya muddati tugagan. Qayta kiring.");
  response.json({ user: publicUser(user) });
}));

export { router as authRouter };
