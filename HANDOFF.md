# Handoff: where the project stands

Read `CLAUDE.md` first (goals, stack, content rules, working style). This file is the current status.

## Done (on `main`, pushed to GitHub)
- **Milestone 1:** React + Vite app, dark/green UI, sidebar (bottom bar on phones), dashboard.
- **Dashboard:** phrase of the day with a Listen button, "I said it out loud" button (feeds the streak), "Your progress" panel (streak, words learned, phrases practised, last 7 days), backup/restore of progress as a JSON file, four activity circles (Vocab, Speaking, Reading, Slang).
- **UI:** green theme chosen by the user from a reference screenshot (LearnLingo-style): dark green panels, coloured activity circles, yellow primary buttons. No leaderboard (user doesn't want one). Colours live as variables at the top of `src/styles.css`.
- **Speech:** `src/lib/speech.js` only speaks with a Portuguese voice (prefers pt-PT). With no Portuguese voice it refuses and shows how to install one. It never reads Portuguese with an English voice.
- **Placeholders:** Vocab, Speaking, Reading and Slang pages say "Not built yet".

## Parked (not on GitHub, local branch only)
Branch `vocab-draft` holds a first flashcard version: `src/data/vocab.json` (40 pt-PT words, all `verified: false`), `src/lib/srs.js` (spaced repetition: Again/Hard/Good/Easy, "already known"), and `src/pages/Vocab.jsx` (session with keyboard shortcuts: Space, then 1 to 4). It was tested and worked. The user asked to plan Vocab properly before building, so it was kept off `main`. Reuse it when it fits. Push the branch to GitHub as a backup if the user agrees.

## Next: plan Vocab (nothing built yet)
The agreed brief for this is in `VOCAB_PROMPT.md` (levels with a pass-to-unlock test, units by topic inside levels, words and phrases, rising exercise difficulty). The branch `vocab-draft` is also on GitHub now.

The user wants Vocab to be the biggest section, organised in **levels** that get harder. Inside each level, the exercise types are part of the level and rise in difficulty: flashcards, fill-in-the-blank, typing the word (more later, such as matching).

Agreed advice to confirm with the user before building:
1. Start with **one level** (about 40 words) to prove the engine; content volume is the real work and every item needs the native speaker's review.
2. Structure: Level, then Unit (a topic, around 10 words), then exercises.
3. One data model: each word stored once with its example sentence; all exercise types read from it.
4. Typing marking: decide how strict to be with accents (suggestion: accept a missing accent, but show the correct spelling).
5. Build in steps: levels + flashcards, then fill-in-the-blank, then typing. Test and commit each step.

## Still pending for the user
- Install a **Portuguese (Portugal)** voice: Windows Settings > Time & language > Speech. Then restart the browser. Until then audio shows an explanation.
- Have the native speaker check the content. Everything is `verified: false`.

## Practical notes (Windows)
- Run the app with `npm.cmd run dev`, then open http://localhost:5173. Plain `npm` is blocked by PowerShell's script policy, and the user chose not to change that setting.
- Node.js LTS is installed. If a terminal can't find `node`, reopen the app.
- Git identity for this repo: `ayaanthakrar09@gmail.com` / `ayaanthakrar09-jpg`. Commits can be made from the agent's terminal. **Pushing needs the user's signed-in shell**, so run `git push` through the Terminal panel tab, not the agent's own terminal.
- Branch is `main`. Test, review the diff, commit with a clear message, then push.
- `frontend-design` skill is enabled on the user's account. Check UI changes in the browser pane at desktop and phone widths.

## Speaking, Reading, Slang (later)
- **Speaking:** browser text-to-speech plus microphone speech-to-text (Chrome/Edge). It transcribes only; it does not score pronunciation. Say so honestly.
- **Reading:** short pt-PT texts, tap a word for its meaning, a few questions.
- **Slang:** labelled expressions (formal, informal, rude, regional). Never invent slang; mark anything unsure.
- **AI tutor:** only later, needs a paid API and a small server to hold the key.
