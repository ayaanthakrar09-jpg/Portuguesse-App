// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoNextControl, useAutoNext } from "./AutoNext";

function Harness({ answered, quick, onNext }) {
  const auto = useAutoNext(answered, quick, onNext);
  return <AutoNextControl auto={auto} />;
}

describe("auto-next", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("waits until the answer is marked", () => {
    const onNext = vi.fn();
    render(<Harness answered={false} quick onNext={onNext} />);
    act(() => vi.advanceTimersByTime(10_000));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Pause" })).not.toBeInTheDocument();
  });

  it("moves on after 1 second when right", () => {
    const onNext = vi.fn();
    render(<Harness answered quick onNext={onNext} />);
    act(() => vi.advanceTimersByTime(999));
    expect(onNext).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("gives 3 seconds to read the correction when wrong", () => {
    const onNext = vi.fn();
    render(<Harness answered quick={false} onNext={onNext} />);
    act(() => vi.advanceTimersByTime(2999));
    expect(onNext).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("stops when paused", () => {
    const onNext = vi.fn();
    render(<Harness answered quick={false} onNext={onNext} />);
    act(() => screen.getByRole("button", { name: "Pause" }).click());
    act(() => vi.advanceTimersByTime(10_000));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Pause" })).not.toBeInTheDocument();
  });

  it("starts again unpaused on the next question", () => {
    const onNext = vi.fn();
    const { rerender } = render(<Harness answered quick onNext={onNext} />);
    act(() => screen.getByRole("button", { name: "Pause" }).click());
    rerender(<Harness answered={false} quick onNext={onNext} />);
    rerender(<Harness answered quick onNext={onNext} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
