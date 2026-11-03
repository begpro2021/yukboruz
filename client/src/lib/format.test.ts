import { describe, expect, it } from "vitest";
import { formatUzs } from "./format";

describe("formatUzs", () => {
  it("formats a positive amount and keeps the currency label", () => {
    expect(formatUzs(5_400_000)).toContain("5");
    expect(formatUzs(5_400_000)).toContain("so'm");
  });
});
