// All progress lives in the browser (localStorage). Clearing browser data erases it,
// so we also offer a backup file you can download and restore.

const KEY = "pt-app-progress-v1";

export function emptyProgress() {
  return {
    version: 1,
    days: [], // dates (YYYY-MM-DD) on which you practised
    practisedPhrases: 0,
    cards: {}, // spaced repetition per vocab item: { id: { due: "YYYY-MM-DD", ... } }
    vocab: { passedLevels: [], tests: {}, choice: {}, typing: {}, order: {} }, // levels passed, test results, best exercise scores per unit (word order: per level)
    reading: {}, // best question score per text: { textId: { best, total } }
    grammar: {}, // best practice score per topic: { topicId: { best, total } }
    slang: null, // best quiz score: { best, total }
    learn: { lessons: {}, xp: {} }, // lessons done per unit, XP per day
  };
}

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ---------- Repairing saved data ---------- */
// Saved progress can be old, half-written or edited by hand. Rather than crash, keep every part that
// has the right shape, fill in what's missing and drop what can't be used.

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isCount = (value) => Number.isFinite(value) && value >= 0;

// The entries of an object that pass `ok`, after `fix` (if given) has repaired them.
function keep(value, ok, fix = (entry) => entry) {
  if (!isObject(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => ok(entry)).map(([key, entry]) => [key, fix(entry)]));
}

// A flashcard needs a due date; the other numbers fall back to a fresh card's.
const isCard = (card) => isObject(card) && isDate(card.due);
const fixCard = (card) => ({
  ...card,
  interval: isCount(card.interval) ? card.interval : 0,
  ease: Number.isFinite(card.ease) && card.ease >= 1.3 ? card.ease : 2.5,
  reps: isCount(card.reps) ? card.reps : 0,
  lapses: isCount(card.lapses) ? card.lapses : 0,
});

// A score record needs a best score and a total above zero (scores are divided by it).
const isScore = (record) => isObject(record) && isCount(record.best) && Number.isFinite(record.total) && record.total > 0;
const fixScore = (record) => ({
  ...record,
  ...(record.last !== undefined && !isCount(record.last) ? { last: record.best } : {}),
  ...(record.passes !== undefined ? { passes: Array.isArray(record.passes) ? record.passes.filter(isDate).sort() : [] } : {}),
});
const isTest = (record) => isObject(record) && isCount(record.best);

export function cleanProgress(data) {
  if (!isObject(data)) return emptyProgress();
  const vocab = isObject(data.vocab) ? data.vocab : {};
  const learn = isObject(data.learn) ? data.learn : {};
  return {
    ...data,
    version: 1,
    days: Array.isArray(data.days) ? [...new Set(data.days.filter(isDate))] : [],
    practisedPhrases: isCount(data.practisedPhrases) ? data.practisedPhrases : 0,
    cards: keep(data.cards, isCard, fixCard),
    vocab: {
      ...vocab,
      passedLevels: Array.isArray(vocab.passedLevels) ? vocab.passedLevels.filter(Number.isInteger) : [],
      tests: keep(vocab.tests, isTest),
      choice: keep(vocab.choice, isScore, fixScore),
      typing: keep(vocab.typing, isScore, fixScore),
      order: keep(vocab.order, isScore, fixScore),
    },
    reading: keep(data.reading, isScore, fixScore),
    grammar: keep(data.grammar, isScore, fixScore),
    slang: isScore(data.slang) ? fixScore(data.slang) : null,
    learn: { ...learn, lessons: keep(learn.lessons, isCount), xp: keep(learn.xp, isCount) },
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    return cleanProgress(JSON.parse(raw));
  } catch {
    // Unreadable: keep a copy before the next save replaces it, so it can still be rescued by hand.
    try {
      localStorage.setItem(`${KEY}-unreadable`, localStorage.getItem(KEY));
    } catch {
      // Storage blocked.
    }
    return emptyProgress();
  }
}

// The saved text exactly as it is, so the crash screen can offer it as a download even if it can't be read.
export function rawSavedProgress() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: nothing was saved anyway.
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage can be blocked (private mode, full disk). The app keeps working in memory.
  }
}

// Consecutive practice days ending today (or yesterday, so the streak survives until you've had a chance today).
export function currentStreak(days) {
  const set = new Set(days);
  const cursor = new Date();
  if (!set.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// `progress` can be the progress object or saved text that is passed through untouched.
export function exportBackup(progress) {
  const text = typeof progress === "string" ? progress : JSON.stringify(progress, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `azulejo-backup-${dateKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Returns the restored progress, or throws a readable error if the file isn't a valid backup.
export async function readBackup(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't a valid backup.");
  }
  if (!isObject(data) || data.version !== 1 || !Array.isArray(data.days) || !isObject(data.cards)) {
    throw new Error("That file isn't a backup from this app.");
  }
  return cleanProgress(data);
}
