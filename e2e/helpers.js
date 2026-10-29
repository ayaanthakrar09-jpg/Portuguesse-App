import { expect } from "@playwright/test";

export const PROGRESS_KEY = "pt-app-progress-v1";

// The main pages, as the menu links to them.
export const pages = [
  { path: "/", heading: /Boa (tarde|noite)|Bom dia/ },
  { path: "/learn", heading: "Learn" },
  { path: "/vocab", heading: "Vocab" },
  { path: "/reading", heading: "Reading" },
  { path: "/grammar", heading: "Grammar" },
  { path: "/slang", heading: "Slang" },
  { path: "/tutor", heading: "Tutor" },
  { path: "/speaking", heading: "Speaking" },
];

// Fails the test if the page logs an error or throws.
export function watchForErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return () => expect(errors, "errors in the browser console").toEqual([]);
}

// No Portuguese voice, so lessons don't add listening questions (test machines rarely have one).
export async function withoutVoices(page) {
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
  });
}

export async function saveProgress(page, progress) {
  await page.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem(key, value);
      sessionStorage.setItem("seeded", "1");
    }
  }, [PROGRESS_KEY, typeof progress === "string" ? progress : JSON.stringify(progress)]);
}

export async function readProgress(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), PROGRESS_KEY);
}
