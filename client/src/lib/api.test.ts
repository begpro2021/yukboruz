import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("sends cookies and decodes JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ value: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(api<{ value: string }>("/health")).resolves.toEqual({ value: "ok" });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/health", expect.objectContaining({ credentials: "include" }));
  });

  it("surfaces API errors without disguising failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Ruxsat yo'q." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await expect(api("/cargos")).rejects.toMatchObject({
      name: "ApiError",
      message: "Ruxsat yo'q.",
      status: 403,
    });
  });
});
