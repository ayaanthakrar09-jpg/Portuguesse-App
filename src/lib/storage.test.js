import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanProgress, currentStreak, emptyProgress, loadProgress, readBackup } from "./storage";
import { pathSteps } from "./lessons";

// A stand-in for the browser's localStorage.
function fakeStorage(items = {}) {
  const store = new Map(Object.entries(items));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    store,
  };
}

const file = (text) => ({ text: async () => text });

describe("cleanProgress", () => {
  it("leaves good progress as it is", () => {
    const good = {
      ...emptyProgress(),
      days: ["2026-10-28", "2026-10-29"],
      practisedPhrases: 4,
      cards: { "l1-001": { due: "2026-10-30", interval: 1, ease: 2.5, reps: 1, lapses: 0 } },
      vocab: { passedLevels: [1, 2], tests: { 1: { best: 90, last: { percent: 90 } } }, choice: { u: { best: 8, total: 10 } }, typing: {}, order: {} },
      grammar: { ser: { best: 9, total: 10, last: 9, lastDate: "2026-10-29", passes: ["2026-10-29"] } },
      slang: { best: 7, total: 10 },
      learn: { lessons: { "l1-greetings": 2 }, xp: { "2026-10-29": 25 } },
    };
    expect(cleanProgress(good)).toEqual(good);
    expect(cleanProgress(emptyProgress())).toEqual(emptyProgress());
  });

  it("turns anything that isn't progress into empty progress", () => {
    for (const junk of [null, undefined, "text", 42, [], true]) expect(cleanProgress(junk)).toEqual(emptyProgress());
  });

  it("fixes the save that used to give a blank screen (cards: null)", () => {
    expect(cleanProgress({ version: 1, days: [], cards: null }).cards).toEqual({});
  });

  it("fills in parts missing from old saves", () => {
    const old = cleanProgress({ version: 1, days: [], cards: {}, vocab: { passedLevels: [1] } });
    expect(old.vocab).toEqual({ passedLevels: [1], tests: {}, choice: {}, typing: {}, order: {} });
    expect(old.learn).toEqual({ lessons: {}, xp: {} });
  });

  it("drops entries that can't be used and repairs ones that can", () => {
    const cleaned = cleanProgress({
      days: ["2026-10-28", "yesterday", 5, "2026-10-28"],
      practisedPhrases: -3,
      cards: { a: { due: "2026-10-30" }, b: { due: "soon" }, c: null },
      vocab: { passedLevels: [1, "2", null] },
      grammar: { zero: { best: 3, total: 0 }, ok: { best: 4, total: 5, passes: "no" } },
      slang: { best: 1 },
      learn: { lessons: { u: "two", v: 3 } },
    });
    expect(cleaned.days).toEqual(["2026-10-28"]);
    expect(cleaned.practisedPhrases).toBe(0);
    expect(cleaned.cards).toEqual({ a: { due: "2026-10-30", interval: 0, ease: 2.5, reps: 0, lapses: 0 } });
    expect(cleaned.vocab.passedLevels).toEqual([1]);
    expect(cleaned.grammar).toEqual({ ok: { best: 4, total: 5, passes: [] } });
    expect(cleaned.slang).toBe(null);
    expect(cleaned.learn.lessons).toEqual({ v: 3 });
  });

  it("gives progress the rest of the app can always read", () => {
    for (const junk of [null, { cards: null, vocab: "x" }, { vocab: { passedLevels: "1" }, learn: [] }]) {
      expect(() => pathSteps(cleanProgress(junk))).not.toThrow();
    }
  });
});

describe("readBackup", () => {
  it("restores a real backup", async () => {
    const backup = { ...emptyProgress(), days: ["2026-10-29"] };
    expect(await readBackup(file(JSON.stringify(backup)))).toEqual(backup);
  });

  it("refuses files that aren't backups from this app", async () => {
    await expect(readBackup(file("not json"))).rejects.toThrow("isn't a valid backup");
    await expect(readBackup(file("null"))).rejects.toThrow("isn't a backup from this app");
    await expect(readBackup(file('{"version":1,"days":[],"cards":null}'))).rejects.toThrow("isn't a backup from this app");
    await expect(readBackup(file('{"version":2,"days":[],"cards":{}}'))).rejects.toThrow("isn't a backup from this app");
  });
});

describe("loadProgress", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts empty when nothing is saved", () => {
    vi.stubGlobal("localStorage", fakeStorage());
    expect(loadProgress()).toEqual(emptyProgress());
  });

  it("keeps a copy of a save it can't read before starting empty", () => {
    const storage = fakeStorage({ "pt-app-progress-v1": "{broken" });
    vi.stubGlobal("localStorage", storage);
    expect(loadProgress()).toEqual(emptyProgress());
    expect(storage.store.get("pt-app-progress-v1-unreadable")).toBe("{broken");
  });

  it("still works when storage is blocked", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } });
    expect(loadProgress()).toEqual(emptyProgress());
  });
});

describe("currentStreak", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 29, 12)); // 29 October 2026, midday
  });
  afterEach(() => vi.useRealTimers());

  it("counts days in a row up to today", () => {
    expect(currentStreak(["2026-10-27", "2026-10-28", "2026-10-29"])).toBe(3);
  });

  it("survives until you've had a chance to practise today", () => {
    expect(currentStreak(["2026-10-27", "2026-10-28"])).toBe(2);
  });

  it("breaks after a missed day", () => {
    expect(currentStreak(["2026-10-26", "2026-10-29"])).toBe(1);
    expect(currentStreak(["2026-10-25", "2026-10-26"])).toBe(0);
  });
});
