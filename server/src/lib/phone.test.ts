import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone.js";
import { HttpError } from "../middleware/errors.js";

describe("normalizePhone", () => {
  it("normalizes Uzbek phone numbers with or without a plus sign", () => {
    expect(normalizePhone("+998 (90) 123-45-67")).toBe("+998901234567");
    expect(normalizePhone("998901234567")).toBe("+998901234567");
  });

  it("rejects malformed numbers with a client error", () => {
    try {
      normalizePhone("not a phone");
      throw new Error("Expected an invalid phone error.");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(400);
    }
  });
});
