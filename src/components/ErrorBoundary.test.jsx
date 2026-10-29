// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

function Broken() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // React and the boundary both log the crash
    localStorage.setItem("pt-app-progress-v1", '{"version":1}');
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the page when nothing goes wrong", () => {
    render(<ErrorBoundary><p>All fine</p></ErrorBoundary>);
    expect(screen.getByText("All fine")).toBeInTheDocument();
  });

  it("shows a way out instead of a blank screen", () => {
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download my progress" })).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("asks before deleting progress, and Cancel keeps it", async () => {
    const user = userEvent.setup();
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    expect(screen.queryByRole("button", { name: /Delete progress/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start fresh…" }));
    expect(screen.getByText(/This deletes all progress/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: /Delete progress/ })).not.toBeInTheDocument();
    expect(localStorage.getItem("pt-app-progress-v1")).not.toBe(null);
  });

  it("doesn't offer a download or a reset when nothing is saved", () => {
    localStorage.clear();
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    expect(screen.queryByRole("button", { name: "Download my progress" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start fresh…" })).not.toBeInTheDocument();
  });

  it("clears the error when you move to another page", () => {
    const { rerender } = render(<ErrorBoundary resetKey="/broken"><Broken /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<ErrorBoundary resetKey="/grammar"><p>Grammar page</p></ErrorBoundary>);
    expect(screen.getByText("Grammar page")).toBeInTheDocument();
  });
});
