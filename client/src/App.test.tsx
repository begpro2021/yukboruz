import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("public routes", () => {
  it("renders the public landing page without requiring the API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    expect(screen.getByRole("heading", { name: "Yuk bor. Yo‘lini toping." })).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("opens registration directly at /register and redirects unauthenticated app users to login", async () => {
    window.history.replaceState(null, "", "/register");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({ error: "Tizimga kirish talab qilinadi." }),
    }));

    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Hisob yarating" })).toBeTruthy());
  });
});
