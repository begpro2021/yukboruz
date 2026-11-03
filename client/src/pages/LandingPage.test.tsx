import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("explains the marketplace sequence and offers separate account actions", () => {
    const onNavigate = vi.fn();
    render(<LandingPage onNavigate={onNavigate} />);

    expect(screen.getByRole("heading", { name: "Yuk bor. Yo‘lini toping." })).toBeTruthy();
    expect(screen.getByRole("list", { name: "YUKBOR'dagi ish jarayoni" }).textContent).toContain("Takliflar keladi");
    expect(screen.getByText("Ko‘rgazmali namuna — real e'lon yoki reys emas.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Bozorga qo‘shilish" }));
    expect(onNavigate).toHaveBeenCalledWith("/register");
    fireEvent.click(screen.getByRole("button", { name: "Kirish" }));
    expect(onNavigate).toHaveBeenCalledWith("/login");
  });
});
