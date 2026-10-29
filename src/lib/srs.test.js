import { describe, expect, it } from "vitest";
import { addDays, dueCards, markKnown, newCards, rate } from "./srs";

const today = "2026-10-29";

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29"); // leap year
  });

  it("isn't thrown off by the clocks changing", () => {
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26"); // Europe goes back an hour on 25 October 2026
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
  });
});

describe("rate", () => {
  it("spaces a new word out as it keeps being remembered: 1 day, 3 days, then growing", () => {
    let card = rate(undefined, "good", today);
    expect(card).toMatchObject({ interval: 1, due: "2026-10-30", reps: 1 });
    card = rate(card, "good", today);
    expect(card.interval).toBe(3);
    card = rate(card, "good", today);
    expect(card.interval).toBe(8); // 3 × 2.5, rounded
  });

  it("brings a forgotten word back today and makes it come back sooner from then on", () => {
    const known = { due: today, interval: 20, ease: 2.5, reps: 4, lapses: 0 };
    const card = rate(known, "again", today);
    expect(card).toMatchObject({ interval: 0, due: today, reps: 0, lapses: 1 });
    expect(card.ease).toBeCloseTo(2.3);
  });

  it("never lets ease drop below 1.3", () => {
    let card;
    for (let i = 0; i < 20; i += 1) card = rate(card, "again", today);
    expect(card.ease).toBe(1.3);
  });

  it("moves a word on slowly when hard and quickly when easy", () => {
    const card = { due: today, interval: 10, ease: 2.5, reps: 3, lapses: 0 };
    expect(rate(card, "hard", today).interval).toBe(12);
    expect(rate(card, "easy", today).interval).toBe(33);
    expect(rate(undefined, "easy", today).interval).toBe(4);
  });

  it("doesn't change the card it was given", () => {
    const card = { due: today, interval: 3, ease: 2.5, reps: 2, lapses: 0 };
    const copy = { ...card };
    rate(card, "good", today);
    expect(card).toEqual(copy);
  });
});

describe("markKnown", () => {
  it("schedules the word a week away", () => {
    expect(markKnown(today)).toMatchObject({ interval: 7, due: "2026-11-05" });
  });
});

describe("dueCards and newCards", () => {
  const words = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const cards = { a: { due: "2026-10-28" }, b: { due: "2026-11-02" } };

  it("finds words due today or earlier", () => {
    expect(dueCards(words, cards, today).map((w) => w.id)).toEqual(["a"]);
  });

  it("finds words never seen", () => {
    expect(newCards(words, cards).map((w) => w.id)).toEqual(["c"]);
  });
});
