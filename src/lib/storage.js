// All progress lives in the browser (localStorage). Clearing browser data erases it,
// so we also offer a backup file you can download and restore.

const KEY = "pt-app-progress-v1";

export function emptyProgress() {
  return {
    version: 1,
    days: [], // dates (YYYY-MM-DD) on which you practised
    practisedPhrases: 0,
    cards: {}, // spaced repetition per vocab item: { id: { due: "YYYY-MM-DD", ... } }
    vocab: { passedLevels: [], tests: {}, choice: {}, typing: {} }, // levels passed, test results, best exercise scores per unit
    reading: {}, // best question score per text: { textId: { best, total } }
    grammar: {}, // best practice score per topic: { topicId: { best, total } }
  };
}

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    return { ...emptyProgress(), ...JSON.parse(raw) };
  } catch {
    return emptyProgress();
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

export function exportBackup(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `portugues-backup-${dateKey()}.json`;
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
  if (data?.version !== 1 || !Array.isArray(data.days) || typeof data.cards !== "object") {
    throw new Error("That file isn't a backup from this app.");
  }
  return { ...emptyProgress(), ...data };
}
