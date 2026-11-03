import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../db.js";

export type AuthenticatedUser = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.session.userId) {
      response.status(401).json({ error: "Tizimga kirish talab qilinadi." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: request.session.userId },
      select: { id: true, name: true, phone: true, role: true },
    });

    if (!user) {
      request.session.destroy(() => undefined);
      response.status(401).json({ error: "Sessiya muddati tugagan. Qayta kiring." });
      return;
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      response.status(403).json({ error: "Bu amal uchun ruxsatingiz yo'q." });
      return;
    }
    next();
  };
}
