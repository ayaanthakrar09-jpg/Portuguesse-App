// Every page opens, with nothing in the console, and nothing sticks out sideways on a phone.

import { expect, test } from "@playwright/test";
import { pages, watchForErrors } from "./helpers";

for (const { path, heading } of pages) {
  test(`${path} opens`, async ({ page }) => {
    const noErrors = watchForErrors(page);
    await page.goto(`/#${path}`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(heading);
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();

    // Wider than the screen means the page scrolls sideways (the phone bug found in the audit).
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "page is wider than the screen").toBeLessThanOrEqual(0);
    noErrors();
  });
}

test("an unknown address shows Page not found", async ({ page }) => {
  await page.goto("/#/no-such-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("the menu reaches every area", async ({ page }) => {
  await page.goto("/#/");
  const menu = page.getByRole("navigation", { name: "Main" });
  for (const name of ["Learn", "Vocab", "Reading", "Grammar", "Slang", "Tutor", "Home"]) {
    await menu.getByRole("link", { name }).click();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  }
});
