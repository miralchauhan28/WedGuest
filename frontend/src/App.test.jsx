import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

describe("App", () => {
  it("renders login page at /", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /login to your account/i })).toBeInTheDocument();
  });
});