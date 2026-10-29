import { describe, expect, it } from "vitest";
import { countStages, itemStage, needsRevision, practiceHint, practiceStage, withPractice } from "./mastery";

describe("itemStage (vocab)", () => {
  it("goes by how long the word can go without being forgotten", () => {
    expect(itemStage(undefined)).toBe(null);
    expect(itemStage({ interval: 6 })).toBe("weak");
    expect(itemStage({ interval: 7 })).toBe("secure");
    expect(itemStage({ interval: 20 })).toBe("secure");
    expect(itemStage({ interval: 21 })).toBe("mastered");
  });

  it("counts new words too", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(countStages(items, { a: { interval: 1 }, b: { interval: 30 } })).toEqual({ new: 1, weak: 1, secure: 0, mastered: 1 });
  });
});

describe("practice records (grammar, reading, slang)", () => {
  it("is weak under 80% and secure at 80% or more", () => {
    expect(practiceStage(withPractice(undefined, 7, 10, "2026-10-01"))).toBe("weak");
    expect(practiceStage(withPractice(undefined, 8, 10, "2026-10-01"))).toBe("secure");
  });

  it("counts one pass per day, however many times you score 80%", () => {
    let record = withPractice(undefined, 10, 10, "2026-10-01");
    record = withPractice(record, 10, 10, "2026-10-01");
    record = withPractice(record, 10, 10, "2026-10-01");
    expect(record.passes).toEqual(["2026-10-01"]);
    expect(practiceStage(record)).toBe("secure");
  });

  it("needs three passing days spanning a week to be mastered", () => {
    let record = withPractice(undefined, 9, 10, "2026-10-01");
    record = withPractice(record, 9, 10, "2026-10-03");
    record = withPractice(record, 9, 10, "2026-10-05");
    expect(practiceStage(record)).toBe("secure"); // three days, but only four days apart
    record = withPractice(record, 9, 10, "2026-10-08");
    expect(practiceStage(record)).toBe("mastered");
  });

  it("drops back to weak after a bad score, but keeps the best", () => {
    let record = withPractice(undefined, 10, 10, "2026-10-01");
    record = withPractice(record, 2, 10, "2026-10-02");
    expect(practiceStage(record)).toBe("weak");
    expect(record.best).toBe(10);
  });

  it("reads old records that only have a best score", () => {
    expect(practiceStage({ best: 9, total: 10 })).toBe("secure");
    expect(practiceStage({ best: 3, total: 10 })).toBe("weak");
  });

  it("suggests revising a secure topic after a week", () => {
    const record = withPractice(undefined, 9, 10, "2026-10-01");
    expect(needsRevision(record, "2026-10-05")).toBe(false);
    expect(needsRevision(record, "2026-10-08")).toBe(true);
    expect(needsRevision(withPractice(undefined, 1, 10, "2026-10-01"), "2026-10-01")).toBe(true);
  });

  it("gives a hint for every stage", () => {
    expect(practiceHint(undefined)).toBe("");
    expect(practiceHint({ best: 1, total: 10 })).toMatch(/80%/);
    expect(practiceHint(withPractice(undefined, 9, 10, "2026-10-01"))).toMatch(/2 more/);
  });
});
