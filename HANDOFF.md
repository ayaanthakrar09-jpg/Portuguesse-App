# Handoff: where the project stands

Read `CLAUDE.md` first (goals, stack, content rules, working style). This file is the current status.

## Done (on `main`)
Pushed to GitHub up to "Add the level test…". The commits after that (tick/cross feedback, Speaking, Reading, this file) are **local only**: the user chose not to push yet. Ask before pushing.

- **App shell:** React + Vite, dark green theme (colours are variables at the top of `src/styles.css`), sidebar that becomes a bottom bar on phones, dashboard with phrase of the day, streak, progress panel, backup/restore of progress as a JSON file. No leaderboard (user doesn't want one).
- **Speech out:** `src/lib/speech.js` only speaks with a Portuguese voice (prefers pt-PT), never an English one. `speak(text, { rate })` supports a slower rate.
- **Vocab (complete for Level 1):**
  - Content: `src/data/levels.json` (levels, units, `passMark` 0.8) and `src/data/vocab/level-1.json` (55 items in 5 topic units, words and phrases, all `verified: false`). Nouns are stored without the article plus `gender`; `displayPt()` adds o/a. `alternatives` lists other accepted answers; `blank` is the gap word in the example sentence.
  - Casual pt-PT is the default (*desculpa*, *como estás?*); the polite form is in `alternatives` or the note. Polite forms stay where they're natural (waiter, strangers).
  - Each unit: Flashcards (spaced repetition, `src/lib/srs.js`), Multiple choice (Portuguese to English, English to Portuguese, fill the gap), Type it (from English). Wrong answers return at the end of a session; green tick / red cross feedback.
  - Marking (`src/lib/answers.js`): ignores capitals, punctuation and missing accents (shows the right spelling), nouns with or without article; anything else only if listed in `alternatives`. Never guesses.
  - Level test: 20 questions getting harder (choice, typed gap, typing), marked at the end (silent on purpose, user agreed). 80% passes and opens the next level permanently. Retake any time. From Level 2 on, a quarter of questions come from earlier levels.
- **Reading:** `src/data/reading/level-1.json`, 3 texts (café, family, station). Every word has a meaning in the text's `glossary` (tap to see it). Listen to the text, 3 comprehension questions, best score saved. All `verified: false`.
- **Speaking (built, switched off):** listen, speak into the mic, see which words the browser's recogniser picked up (`src/lib/recognition.js`). Honest labels: transcription only, not a pronunciation score; audio goes to Google/Microsoft in Chrome/Edge. It could not be tried with a real mic (the agent's preview pane blocks microphones), so the user asked to lock it. Turn it on with `speakingReady` in `src/App.jsx` and `ready` for Speaking in `src/pages/Dashboard.jsx`.
- **Slang:** not built (placeholder page).

## Progress data
Saved in `localStorage` (key `pt-app-progress-v1`), included in the backup file: `days`, `practisedPhrases`, `cards` (spaced repetition per vocab item), `vocab` (`passedLevels`, `tests`, best `choice`/`typing` scores per unit), `reading` (best score per text).

## Next
1. **Decide on a Grammar section.** The user wants one (conjugations etc.); `CLAUDE.md` still lists grammar as "later", so update it once agreed. Suggested shape: short reference cards plus typing drills that reuse the Vocab marking.
2. **Slang section** (labelled formal/informal/rude, region; never invent slang, mark anything unsure).
3. **Vocab Level 2** (more phrases) plus the "put the words in order" exercise from `VOCAB_PROMPT.md`.
4. Try Speaking with a real microphone in Chrome or Edge, then switch it back on.

## Still pending for the user
- Install a **Portuguese (Portugal)** voice: Windows Settings > Time & language > Speech, then restart the browser.
- Native speaker review of all content (`verified: false` everywhere). Worth checking first: *um café* = espresso, *se faz favor*, *torrada*, *ao balcão*, *só vem a casa ao fim de semana*.

## Practical notes (Windows)
- Run the app with `npm.cmd run dev`, then open http://localhost:5173. Plain `npm` is blocked by PowerShell's script policy; the user chose not to change it.
- URLs use a hash: `http://localhost:5173/#/vocab`, not `/vocab`.
- If the dev server shows a blank page after many quick edits, restart it; Vite's hot reload can get stuck on a half-edited file.
- Git identity: `ayaanthakrar09@gmail.com` / `ayaanthakrar09-jpg`. The agent can commit; **pushing needs the user's signed-in shell** (Terminal panel).
- Branch `main`. Test, review the diff, commit, then push when the user says so. The old `vocab-draft` branch is superseded (its spaced repetition was reused).
- Check UI changes in the browser pane at desktop and phone widths. Clean up test progress in the pane's `localStorage` afterwards.

## Later
- **AI tutor:** needs a paid API and a small server to hold the key.
