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
function options(correct, others) {
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

// One question per item, of a random kind:
//  "pt-en": see the Portuguese, pick the English
//  "en-pt": see the English, pick the Portuguese
//  "blank": the example sentence with a gap (its English shown so only one answer fits), pick the missing word
export function choiceQuestions(items) {
  return shuffle(items).map((item) => {
    const others = items.filter((other) => other.id !== item.id);
    const kinds = ["pt-en", "en-pt"];
    if (item.blank && item.example.pt.includes(item.blank)) kinds.push("blank", "blank");
    const kind = kinds[Math.floor(Math.random() * kinds.length)];

    if (kind === "pt-en") {
      return { item, kind, prompt: displayPt(item), answer: item.en, options: options(item.en, others.map((o) => o.en)) };
    }
    if (kind === "en-pt") {
      const answer = displayPt(item);
      return { item, kind, prompt: item.en, answer, options: options(answer, others.map(displayPt)) };
    }
    const index = item.example.pt.indexOf(item.blank);
    const before = item.example.pt.slice(0, index);
    const after = item.example.pt.slice(index + item.blank.length);
    const startsSentence = before.trim() === "" || /[.!?]\s*$/.test(before);
    const gapOptions = others.filter((o) => o.blank).map((o) => likeGap(o.blank, startsSentence));
    return { item, kind, before, after, prompt: item.example.en, answer: item.blank, options: options(item.blank, gapOptions) };
  });
}

// Records a session score, keeping the best per unit. `kind` is "typing" or "choice".
export function withBestScore(progress, kind, unit, score) {
  const scores = progress.vocab[kind] ?? {};
  const best = Math.max(score, scores[unit.id]?.best ?? 0);
  return { ...progress, vocab: { ...progress.vocab, [kind]: { ...scores, [unit.id]: { best, total: unit.items.length } } } };
}
