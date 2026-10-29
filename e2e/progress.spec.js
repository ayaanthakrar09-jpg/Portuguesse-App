// Saved progress: backups out and back in, and broken saves that used to give a blank screen.

import { expect, test } from "@playwright/test";
import { PROGRESS_KEY, readProgress, saveProgress, watchForErrors } from "./helpers";

const backup = {
  version: 1,
  days: ["2026-10-01", "2026-10-02"],
  practisedPhrases: 5,
  cards: { "l1-001": { due: "2026-10-03", interval: 1, ease: 2.5, reps: 1, lapses: 0 } },
  vocab: { passedLevels: [1], tests: {}, choice: {}, typing: {}, order: {} },
  reading: {},
  grammar: {},
  slang: null,
  learn: { lessons: {}, xp: {} },
};

test("a backup can be downloaded and restored", async ({ page }) => {
  await saveProgress(page, backup);
  await page.goto("/#/");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^azulejo-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const text = await (await file.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks).toString());
  expect(JSON.parse(text)).toMatchObject({ practisedPhrases: 5, vocab: { passedLevels: [1] } });

  // Start empty, then restore the downloaded file.
  await page.evaluate((key) => localStorage.removeItem(key), PROGRESS_KEY);
  await page.reload();
  await page.locator('input[type="file"]').setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(text) });
  await expect(page.getByRole("status").filter({ hasText: "Backup restored." })).toBeVisible();
  expect((await readProgress(page)).vocab.passedLevels).toEqual([1]);
});

test("a file that isn't a backup is refused and changes nothing", async ({ page }) => {
  await saveProgress(page, backup);
  await page.goto("/#/");
  await page.locator('input[type="file"]').setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from('{"version":1,"days":[],"cards":null}') });
  await expect(page.getByRole("status")).toHaveText("That file isn't a backup from this app.");
  expect((await readProgress(page)).practisedPhrases).toBe(5);
});

test("a broken save opens normally instead of a blank screen", async ({ page }) => {
  const noErrors = watchForErrors(page);
  await saveProgress(page, { version: 1, days: "x", cards: null, vocab: "x", learn: [] });
  for (const path of ["/", "/learn", "/vocab/level/1", "/grammar", "/reading", "/slang"]) {
    await page.goto(`/#${path}`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
  }
  noErrors();
});

test("an unreadable save is kept aside and the app starts empty", async ({ page }) => {
  await saveProgress(page, "{not json");
  await page.goto("/#/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(`${key}-unreadable`), PROGRESS_KEY)).toBe("{not json");
});
