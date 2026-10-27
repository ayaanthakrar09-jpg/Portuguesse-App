// Builds exercise questions from vocab items. Every question type reads the same item data.

import { displayPt } from "./vocab";

export function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The correct option plus up to three different ones from the other items, in random order.
export function options(correct, others) {
  const key = (text) => text.toLowerCase();
  const seen = new Set([key(correct)]);
  const wrong = [];
  for (const text of shuffle(others)) {
    if (wrong.length === 3) break;
    if (seen.has(key(text))) continue;
    seen.add(key(text));
    wrong.push(text);
  }
  return shuffle([correct, ...wrong]);
}

// Match the capital letter of the gap, so a capital never gives the answer away.
function likeGap(text, gapStartsSentence) {
  return gapStartsSentence ? text[0].toUpperCase() + text.slice(1) : text[0].toLowerCase() + text.slice(1);
}

// The example sentence split around the gap word.
function gapParts(item) {
  const index = item.example.pt.indexOf(item.blank);
  return { before: item.example.pt.slice(0, index), after: item.example.pt.slice(index + item.blank.length) };
}

function hasGap(item) {
  return Boolean(item.blank) && item.example.pt.includes(item.blank);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// A multiple-choice question about `item`, with wrong options taken from `pool` (normally its unit). Kinds:
//  "pt-en": see the Portuguese, pick the English
//  "en-pt": see the English, pick the Portuguese
//  "blank": the example sentence with a gap (its English shown so only one answer fits), pick the missing word
export function choiceQuestion(item, pool) {
  const others = pool.filter((other) => other.id !== item.id);
  const kind = pick(hasGap(item) ? ["pt-en", "en-pt", "blank", "blank"] : ["pt-en", "en-pt"]);

  if (kind === "pt-en") {
    return { item, kind, prompt: displayPt(item), answer: item.en, options: options(item.en, others.map((o) => o.en)) };
  }
  if (kind === "en-pt") {
    const answer = displayPt(item);
    return { item, kind, prompt: item.en, answer, options: options(answer, others.map(displayPt)) };
  }
  const { before, after } = gapParts(item);
  const startsSentence = before.trim() === "" || /[.!?]\s*$/.test(before);
  const gapOptions = others.filter((o) => o.blank).map((o) => likeGap(o.blank, startsSentence));
  return { item, kind, before, after, prompt: item.example.en, answer: item.blank, options: options(item.blank, gapOptions) };
}

export function choiceQuestions(items) {
  return shuffle(items).map((item) => choiceQuestion(item, items));
}

// Typed questions: "type-gap" fills the sentence gap, "type" writes the whole item from its English.
function typeGapQuestion(item) {
  return { item, kind: "type-gap", ...gapParts(item), prompt: item.example.en, answer: item.blank };
}

export function typeQuestion(item) {
  return { item, kind: "type", prompt: item.en, answer: displayPt(item) };
}

// Word order: only phrases of three or more words. They're fixed expressions, so one order is right;
// any other natural order must be listed in the item's `alternatives`.
function words(text) {
  return text.replace(/[.,!?¿¡;:…]/g, " ").split(/\s+/).filter(Boolean);
}

export function canOrder(item) {
  return item.type === "phrase" && words(item.pt).length >= 3;
}

export function orderItems(level) {
  return level.units.flatMap((unit) => unit.items).filter(canOrder);
}

export function orderQuestion(item) {
  const tiles = words(item.pt).map((text, id) => ({ id, text }));
  let shuffled = shuffle(tiles);
  while (shuffled.every((tile, index) => tile.id === index)) shuffled = shuffle(tiles); // never start already solved
  return { item, kind: "order", prompt: item.en, answer: item.pt, tiles: shuffled };
}

// The sentence built from the tiles picked so far (tile ids, in order).
export function orderedText(question, chosen) {
  return chosen.map((id) => question.tiles.find((tile) => tile.id === id).text).join(" ");
}

export const TEST_LENGTH = 20;

// A level test: TEST_LENGTH questions getting harder (multiple choice, then word order or typed gaps, then typing from English).
// From Level 2 on, a quarter of the questions revisit earlier levels.
export function testQuestions(levelItems, earlierItems, unitItems) {
  const fromEarlier = earlierItems.length ? Math.min(earlierItems.length, Math.round(TEST_LENGTH / 4)) : 0;
  const chosen = shuffle([
    ...shuffle(levelItems).slice(0, TEST_LENGTH - fromEarlier),
    ...shuffle(earlierItems).slice(0, fromEarlier),
  ]);
  const third = Math.round(chosen.length / 3);
  const withGap = chosen.slice(third, third * 2);
  return [
    ...chosen.slice(0, third).map((item) => choiceQuestion(item, unitItems(item))),
    ...withGap.map((item) => (canOrder(item) ? orderQuestion(item) : hasGap(item) ? typeGapQuestion(item) : typeQuestion(item))),
    ...chosen.slice(third * 2).map(typeQuestion),
  ];
}

// Records a session score, keeping the best per unit. `kind` is "typing" or "choice".
export function withBestScore(progress, kind, unit, score) {
  const scores = progress.vocab[kind] ?? {};
  const best = Math.max(score, scores[unit.id]?.best ?? 0);
  return { ...progress, vocab: { ...progress.vocab, [kind]: { ...scores, [unit.id]: { best, total: unit.items.length } } } };
}

// Records a level test attempt. Passing adds the level to passedLevels, which opens the next level.
export function withTestResult(progress, levelId, score, total, passed, date) {
  const tests = progress.vocab.tests ?? {};
  const previous = tests[levelId] ?? {};
  const percent = Math.round((score / total) * 100);
  const passedLevels = progress.vocab.passedLevels;
  return {
    ...progress,
    vocab: {
      ...progress.vocab,
      passedLevels: passed && !passedLevels.includes(levelId) ? [...passedLevels, levelId] : passedLevels,
      tests: { ...tests, [levelId]: { best: Math.max(percent, previous.best ?? 0), last: { date, score, total, percent } } },
    },
  };
}
