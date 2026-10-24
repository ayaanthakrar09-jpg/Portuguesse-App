// Spaced repetition: each rating schedules when a card comes back.
// A card is { due: "YYYY-MM-DD", interval: days, ease, reps, lapses }.

import { dateKey } from "./storage";

export const NEW_PER_SESSION = 10;
export const RATINGS = ["again", "hard", "good", "easy"];

export function addDays(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}

const freshCard = { interval: 0, ease: 2.5, reps: 0, lapses: 0 };

// Returns the card's new state after a rating. Does not change the original.
export function rate(card, rating, today) {
  const base = card ?? freshCard;
  let { interval, ease, reps, lapses } = base;

  if (rating === "again") {
    interval = 0;
    reps = 0;
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (rating === "hard") {
    interval = Math.max(1, Math.round(interval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
    reps += 1;
  } else if (rating === "good") {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
    reps += 1;
  } else {
    interval = reps === 0 ? 4 : Math.max(interval + 1, Math.round(interval * ease * 1.3));
    ease += 0.15;
    reps += 1;
  }

  return { due: addDays(today, interval), interval, ease, reps, lapses };
}

// For "I already know this": skips the early steps.
export function markKnown(today) {
  return { due: addDays(today, 21), interval: 21, ease: 2.5, reps: 3, lapses: 0 };
}

export function intervalLabel(card, rating, today) {
  const { interval } = rate(card, rating, today);
  return interval === 0 ? "again soon" : interval === 1 ? "1 day" : `${interval} days`;
}

export function dueCards(vocab, cards, today) {
  return vocab.filter((word) => cards[word.id] && cards[word.id].due <= today);
}

export function newCards(vocab, cards) {
  return vocab.filter((word) => !cards[word.id]);
}

export function learnedCount(cards) {
  return Object.values(cards).filter((card) => card.reps > 0).length;
}
