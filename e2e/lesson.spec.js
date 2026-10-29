// Plays a whole Learn lesson the way a learner would, without being told the answers:
// it guesses, reads the correction when it's wrong, and uses it when the question comes back.
// So this also checks that wrong answers really come back and that the lesson can be finished.

import { expect, test } from "@playwright/test";
import { readProgress, watchForErrors, withoutVoices } from "./helpers";

const words = (text) => text.replace(/[.,!?¿¡;:…"]/g, " ").split(/\s+/).filter(Boolean);

// What identifies a question, so it can be recognised when it comes back with new options or tiles.
async function questionKey(question) {
  const prompt = question.locator(".flash-word, .gap-sentence .muted, .sentence-text").first();
  const kind = (await question.locator(".tile-pool").count()) ? "tiles"
    : (await question.locator(".choices").count()) ? "choice"
    : "type";
  return `${kind}: ${await prompt.innerText()}`;
}

async function answer(page, question, key, known) {
  if (key.startsWith("choice")) {
    const options = question.locator(".choices button");
    const option = known ? options.filter({ hasText: known }).first() : options.first();
    await option.click();
  } else if (key.startsWith("tiles")) {
    const pool = question.getByLabel("Words to use");
    for (const word of known ? words(known) : [null]) {
      const tile = word
        ? pool.locator(".tile").filter({ hasText: new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).first()
        : pool.locator(".tile").first();
      await tile.click();
    }
  } else {
    await question.getByLabel("Your answer in Portuguese").fill(known ?? "não sei");
  }
  await page.getByRole("button", { name: "Check" }).click();
}

test("a whole lesson can be finished and is saved", async ({ page }) => {
  test.setTimeout(120_000);
  const noErrors = watchForErrors(page);
  await withoutVoices(page);

  await page.goto("/#/learn");
  await page.getByRole("link", { name: /Greetings and courtesy/ }).click();
  await expect(page.getByRole("button", { name: "Leave lesson" })).toBeVisible();

  const learned = new Map();
  let wrong = 0;
  let cameBack = 0;
  for (let step = 0; step < 80; step += 1) {
    const end = page.locator(".lesson-end-title");
    const question = page.locator(".lesson-question");
    await expect(end.or(question)).toBeVisible();
    if (await end.isVisible()) break;

    if (await question.locator(".new-word").count()) {
      await page.getByRole("button", { name: "Continue" }).click();
      continue;
    }

    const key = await questionKey(question);
    const known = learned.get(key);
    if (known) cameBack += 1;
    await answer(page, question, key, known);

    const feedback = page.locator(".check-feedback");
    await expect(feedback).toBeVisible();
    if ((await feedback.locator(".feedback-title").innerText()).includes("Correct answer")) {
      expect(known, `marked wrong although given the shown answer: ${key}`).toBeUndefined();
      wrong += 1;
      learned.set(key, await feedback.locator(".check-answer").innerText());
    }
    // Stop the automatic move-on, then move on by hand (both are what a learner can do).
    await page.getByRole("button", { name: "Pause" }).click({ timeout: 500 }).catch(() => {});
    await page.getByRole("button", { name: "Continue" }).click({ timeout: 1000 }).catch(() => {});
    await expect(feedback).toBeHidden();
  }

  await expect(page.locator(".lesson-end-title")).toHaveText(/Muito bem!|Perfeito!/);
  expect(wrong, "some guesses should have been wrong").toBeGreaterThan(0);
  // A wrong multiple-choice question can come back in another form (English to Portuguese instead), so not every one is recognised.
  expect(cameBack, "wrong answers come back").toBeGreaterThan(0);

  const progress = await readProgress(page);
  expect(progress.learn.lessons["l1-greetings"]).toBe(1);
  expect(Object.values(progress.learn.xp)).toEqual([10]); // no bonus: there were mistakes
  expect(Object.keys(progress.cards).length).toBeGreaterThan(0);
  noErrors();
});
