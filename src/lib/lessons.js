// The Learn path: short mixed lessons, one unit at a time, mostly built from the example sentences.
// A lesson meets up to five words of a unit (new ones first, then the ones you know least)
// and asks two questions about each: word questions and whole-sentence ones.

import { markAnswer, markText } from "./answers";
import { choiceQuestion, shuffle, typeQuestion } from "./exercises";
import { rate } from "./srs";
import { allItems, isLevelOpen, levels } from "./vocab";

export const LESSONS_PER_UNIT = 3;
const FOCUS_PER_LESSON = 5;
export const XP_PER_LESSON = 10;
export const XP_PERFECT_BONUS = 5;
export const DAILY_GOAL_XP = 30;

function sentenceWords(text) {
  return text.replace(/[.,!?¿¡;:…"]/g, " ").split(/\s+/).filter(Boolean);
}

// Words written with a capital in the middle of a sentence (names, places, "I") keep it on their tile.
// Any other first word is lowercased, so the capital doesn't give away where the sentence starts.
// A capital straight after . ! or ? is a new sentence, not a name.
const keepsCapital = new Set(
  allItems.flatMap((item) => [item.example.pt, item.example.en]).flatMap((sentence) => {
    const tokens = sentence.split(/\s+/);
    return tokens.slice(1)
      .filter((token, i) => !/[.!?…]["»]?$/.test(tokens[i]))
      .map((token) => token.replace(/[.,!?¿¡;:…"]/g, ""))
      .filter((word) => /^\p{Lu}/u.test(word));
  }),
);

function tileText(word, first) {
  return first && !keepsCapital.has(word) ? word[0].toLowerCase() + word.slice(1) : word;
}

// The sentence's words plus a few from other sentences in the unit that don't belong, shuffled.
function sentenceTiles(sentence, otherSentences) {
  const words = sentenceWords(sentence).map((word, i) => tileText(word, i === 0));
  const inSentence = new Set(words.map((word) => word.toLowerCase()));
  const extras = [];
  for (const other of shuffle(otherSentences)) {
    for (const word of shuffle(sentenceWords(other).map((w, i) => tileText(w, i === 0)))) {
      if (extras.length === 3) break;
      if (inSentence.has(word.toLowerCase())) continue;
      inSentence.add(word.toLowerCase());
      extras.push(word);
    }
    if (extras.length === 3) break;
  }
  return shuffle([...words, ...extras].map((text, id) => ({ id, text })));
}

const isSentence = (item) => sentenceWords(item.example.pt).length >= 3;

// One question of `kind` about `item`; `unitItems` supplies wrong options and extra tiles.
export function lessonQuestion(kind, item, unitItems) {
  const others = unitItems.filter((other) => other.id !== item.id);
  if (kind === "choice") return choiceQuestion(item, unitItems);
  if (kind === "type") return typeQuestion(item);
  if (kind === "build-en") {
    return { item, kind, prompt: item.example.pt, answer: item.example.en, tiles: sentenceTiles(item.example.en, others.map((o) => o.example.en)) };
  }
  // "build-pt" shows the English; "listen" only plays the Portuguese.
  return { item, kind, prompt: item.example.en, answer: item.example.pt, tiles: sentenceTiles(item.example.pt, others.map((o) => o.example.pt)) };
}

// New words first, then words due for review, then the least well known.
function focusItems(unit, cards, today) {
  const rank = (item) => {
    const card = cards[item.id];
    if (!card) return 0;
    return card.due <= today ? 1 : 2 + card.interval;
  };
  return shuffle(unit.items).sort((a, b) => rank(a) - rank(b)).slice(0, FOCUS_PER_LESSON);
}

// The lesson's screens: a "new word" card before a new word's first question, then two questions per word.
export function buildLesson(unit, cards, today, { canListen }) {
  const focus = focusItems(unit, cards, today);
  const first = [];
  const later = [];
  for (const item of focus) {
    const kinds = ["choice", "type"];
    if (isSentence(item)) kinds.push("build-pt", "build-pt", "build-en", ...(canListen ? ["listen"] : []));
    const isNew = !cards[item.id];
    const [a, b] = shuffle(kinds.filter((kind) => kind !== "choice")).filter((kind, i, list) => list.indexOf(kind) === i);
    if (isNew) first.push({ item, kind: "new" });
    // A brand-new word starts with the easiest question.
    first.push(lessonQuestion(isNew ? "choice" : a, item, unit.items));
    later.push(lessonQuestion(isNew ? a : b ?? "choice", item, unit.items));
  }
  return { focus, screens: [...first, ...shuffle(later)] };
}

// Whether an answer is right. Word tiles and typing are marked the same way as elsewhere:
// capitals, punctuation and accents are forgiven; word order is not.
export function isRight(question, answer) {
  if (question.kind === "type") return markAnswer(answer, question.item) !== "wrong";
  return markText(answer, [question.answer]) !== "wrong";
}

/* ---------- Saving ---------- */

export function lessonsDone(progress, unitId) {
  return progress.learn?.lessons?.[unitId] ?? 0;
}

export function xpOn(progress, day) {
  return progress.learn?.xp?.[day] ?? 0;
}

// After a lesson: words got wrong come back soon; words got right move on if they were new or due.
// Also counts the lesson for its unit and adds the XP to today.
export function withLessonResult(progress, unit, focus, missedIds, xp, today) {
  const cards = { ...progress.cards };
  for (const item of focus) {
    const card = cards[item.id];
    if (missedIds.has(item.id)) cards[item.id] = rate(card, "again", today);
    else if (!card || card.due <= today) cards[item.id] = rate(card, "good", today);
  }
  const learn = progress.learn ?? {};
  return {
    ...progress,
    cards,
    days: progress.days.includes(today) ? progress.days : [...progress.days, today],
    learn: {
      ...learn,
      lessons: { ...learn.lessons, [unit.id]: lessonsDone(progress, unit.id) + 1 },
      xp: { ...learn.xp, [today]: xpOn(progress, today) + xp },
    },
  };
}

/* ---------- The path ---------- */

// Every level with its units and test, each marked done, current or locked. Only one thing is current:
// the first unfinished unit in an open level, or that level's test once all its units are done.
export function pathSteps(progress) {
  const passed = progress.vocab.passedLevels;
  let currentFound = false;
  return levels.map((level) => {
    const open = isLevelOpen(level.id, passed);
    const units = level.units.map((unit) => {
      const count = lessonsDone(progress, unit.id);
      const done = count >= LESSONS_PER_UNIT;
      const current = open && !done && !currentFound;
      if (current) currentFound = true;
      return { unit, count, done, current, open };
    });
    const testPassed = passed.includes(level.id);
    const testCurrent = open && !testPassed && !currentFound && units.every((step) => step.done);
    if (testCurrent) currentFound = true;
    return { level, open, units, test: { passed: testPassed, current: testCurrent } };
  });
}

export function currentUnitStep(progress) {
  return pathSteps(progress).flatMap((level) => level.units).find((step) => step.current);
}
