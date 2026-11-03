import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AuthScreen from "./AuthScreen";

describe("AuthScreen", () => {
  it("does not offer dispatcher as a public registration role", () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ro‘yxatdan o‘tish" }));

    const roleSelect = screen.getByLabelText("Profil turi") as HTMLSelectElement;
    expect(Array.from(roleSelect.options, (option) => option.textContent)).not.toContain("Dispetcher");
  });
});
