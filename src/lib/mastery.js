// How well something is known: weak, secure or mastered. Both rules need time between sessions,
// so nothing can be mastered in one sitting.

import { addDays } from "./srs";

export const STAGES = ["mastered", "secure", "weak"];
export const stageLabel = { weak: "Weak", secure: "Secure", mastered: "Mastered" };

/* ---------- Vocab: from the spaced-repetition card ---------- */

// The card's interval is how long you've shown you can go without forgetting it.
// Weak: seen, but not yet remembered after a gap of a week. Secure: a week or more. Mastered: three weeks or more.
export const SECURE_DAYS = 7;
export const MASTERED_DAYS = 21;

export function itemStage(card) {
  if (!card) return null;
  if (card.interval >= MASTERED_DAYS) return "mastered";
  if (card.interval >= SECURE_DAYS) return "secure";
  return "weak";
}

// { new, weak, secure, mastered } for a list of vocab items.
export function countStages(items, cards) {
  const counts = { new: 0, weak: 0, secure: 0, mastered: 0 };
  for (const item of items) counts[itemStage(cards[item.id]) ?? "new"] += 1;
  return counts;
}

/* ---------- Grammar, reading, slang: from practice scores ---------- */

// Weak: the last score was under 80%. Secure: 80% or more last time.
// Mastered: 80% or more on three different days, at least a week from the first to the last.
export const PASS = 0.8;
const MASTERED_PASSES = 3;
const MASTERED_SPAN = 7;

// A practice record is { best, total, last, lastDate, passes: [dates scored 80%+] }.
// Records saved before stages existed only have { best, total }; their best counts as the last score.
export function withPractice(record, score, total, today) {
  const passes = record?.passes ?? [];
  const passed = score / total >= PASS;
  return {
    best: Math.max(score, record?.best ?? 0),
    total,
    last: score,
    lastDate: today,
    passes: passed && !passes.includes(today) ? [...passes, today] : passes,
  };
}

export function practiceStage(record) {
  if (!record) return null;
  const last = record.last ?? record.best;
  if (last / record.total < PASS) return "weak";
  const passes = record.passes ?? [];
  if (passes.length >= MASTERED_PASSES && addDays(passes[0], MASTERED_SPAN) <= passes[passes.length - 1]) return "mastered";
  return "secure";
}

// What to do next to move up a stage, in one short sentence.
export function practiceHint(record) {
  const stage = practiceStage(record);
  if (!stage) return "";
  if (stage === "weak") return "Score 80% or more to make it secure.";
  if (stage === "mastered") return "Mastered. Come back now and then to keep it.";
  const passes = record.passes ?? [];
  const left = Math.max(1, MASTERED_PASSES - passes.length);
  return `Score 80% again on ${left} more ${left === 1 ? "day" : "different days"}, a week or more after the first, to master it.`;
}

// A secure topic is worth revising once a week has passed since you last practised it.
export function needsRevision(record, today) {
  const stage = practiceStage(record);
  if (stage === "weak") return true;
  return stage === "secure" && Boolean(record.lastDate) && addDays(record.lastDate, MASTERED_SPAN) <= today;
}
