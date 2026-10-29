// These go through every unit of real content, so a data mistake that makes a question
// impossible to answer fails here instead of in front of the learner.

import { describe, expect, it } from "vitest";
import { choiceQuestion } from "./exercises";
import { LESSONS_PER_UNIT, buildLesson, isRight, lessonQuestion, lessonsDone, pathSteps, withLessonResult, xpOn } from "./lessons";
import { emptyProgress } from "./storage";
import { allItems, levels } from "./vocab";

const today = "2026-10-29";
const units = levels.flatMap((level) => level.units);
const words = (text) => text.replace(/[.,!?¿¡;:…"]/g, " ").split(/\s+/).filter(Boolean);

// Builds the right answer from the tiles, the way a learner would tap them.
function tapAnswer(question) {
  const unused = [...question.tiles];
  return words(question.answer).map((word) => {
    const index = unused.findIndex((tile) => tile.text.toLowerCase() === word.toLowerCase());
    if (index === -1) throw new Error(`${question.item.id}: no tile for "${word}" in "${question.answer}"`);
    return unused.splice(index, 1)[0].text;
  }).join(" ");
}

function rightAnswer(question) {
  return question.tiles ? tapAnswer(question) : question.answer;
}

describe("every lesson of every unit can be answered", () => {
  for (const unit of units) {
    it(unit.id, () => {
      for (let lessonNumber = 1; lessonNumber <= LESSONS_PER_UNIT; lessonNumber += 1) {
        const lesson = buildLesson(unit, {}, today, { canListen: true, lessonNumber });
        expect(lesson.screens.length).toBeGreaterThan(0);
        for (const screen of lesson.screens) {
          if (screen.kind === "new") continue;
          expect(isRight(screen, rightAnswer(screen)), `${screen.item.id} ${screen.kind}`).toBe(true);
          if (screen.options) expect(screen.options).toContain(screen.answer);
        }
      }
    });
  }
});

// A wrong answer comes back as lessonQuestion(screen.kind, ...). This used to turn a wrong
// multiple-choice question into one with no options, which crashed the lesson.
describe("a question asked again", () => {
  it("is the same type of question and can still be answered", () => {
    for (const unit of units) {
      for (let lessonNumber = 1; lessonNumber <= LESSONS_PER_UNIT; lessonNumber += 1) {
        const lesson = buildLesson(unit, {}, today, { canListen: true, lessonNumber });
        for (const screen of lesson.screens.filter((s) => s.kind !== "new")) {
          const again = lessonQuestion(screen.kind, screen.item, unit.items);
          expect(Boolean(again.options), `${screen.item.id} ${screen.kind}`).toBe(Boolean(screen.options));
          expect(Boolean(again.tiles), `${screen.item.id} ${screen.kind}`).toBe(Boolean(screen.tiles));
          expect(isRight(again, rightAnswer(again))).toBe(true);
        }
      }
    }
  });
});

describe("multiple choice", () => {
  it("always has the answer once and no repeated options", () => {
    for (const unit of units) {
      for (const item of unit.items) {
        for (let i = 0; i < 4; i += 1) {
          const { options, answer } = choiceQuestion(item, unit.items);
          expect(options).toContain(answer);
          expect(new Set(options.map((o) => o.toLowerCase())).size, `${item.id}`).toBe(options.length);
        }
      }
    }
  });
});

describe("withLessonResult", () => {
  const unit = units[0];
  const [missed, right] = unit.items;
  const after = withLessonResult(emptyProgress(), unit, [missed, right], new Set([missed.id]), 15, today);

  it("brings missed words back today and moves right ones on", () => {
    expect(after.cards[missed.id].due).toBe(today);
    expect(after.cards[right.id].due).toBe("2026-10-30");
  });

  it("counts the lesson, the XP and the day once", () => {
    expect(lessonsDone(after, unit.id)).toBe(1);
    expect(xpOn(after, today)).toBe(15);
    const again = withLessonResult(after, unit, [right], new Set(), 10, today);
    expect(lessonsDone(again, unit.id)).toBe(2);
    expect(xpOn(again, today)).toBe(25);
    expect(again.days).toEqual([today]);
  });
});

describe("pathSteps", () => {
  it("starts at the first unit with only Level 1 open", () => {
    const steps = pathSteps(emptyProgress());
    expect(steps[0].units[0].current).toBe(true);
    expect(steps.filter((level) => level.open).map((level) => level.level.id)).toEqual([1]);
    expect(steps.flatMap((level) => level.units).filter((step) => step.current)).toHaveLength(1);
  });

  it("moves to the checkpoint when every unit of the level is done", () => {
    const lessons = Object.fromEntries(levels[0].units.map((u) => [u.id, LESSONS_PER_UNIT]));
    const steps = pathSteps({ ...emptyProgress(), learn: { lessons, xp: {} } });
    expect(steps[0].test.current).toBe(true);
  });
});

it("content has unique ids", () => {
  expect(new Set(allItems.map((item) => item.id)).size).toBe(allItems.length);
});
