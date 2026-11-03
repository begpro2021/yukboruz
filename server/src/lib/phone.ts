import { HttpError } from "../middleware/errors.js";

export function normalizePhone(phone: string): string {
  const normalized = phone.trim().replace(/[\s()-]/g, "");
  if (!/^\+?\d{9,15}$/.test(normalized)) {
    throw new HttpError(400, "Telefon raqami noto'g'ri formatda.");
  }
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}
