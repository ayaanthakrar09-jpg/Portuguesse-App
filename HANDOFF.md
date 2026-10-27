# Handoff: where the project stands

Read `CLAUDE.md` first (goals, stack, content rules, working style). This file is the current status.

## Done (on `main`)
Everything up to the Slang quiz is pushed to GitHub (26 October 2026). Ask the user before each push; they run it from their Terminal panel.

- **App shell:** React + Vite, dark green theme (colours are variables at the top of `src/styles.css`), sidebar that becomes a bottom bar on phones, dashboard with phrase of the day, streak, progress panel, backup/restore of progress as a JSON file. No leaderboard (user doesn't want one).
- **Speech out:** `src/lib/speech.js` only speaks with a Portuguese voice (prefers pt-PT), never an English one. `speak(text, { rate })` supports a slower rate.
- **Vocab (complete for Level 1):**
  - Content: `src/data/levels.json` (levels, units, `passMark` 0.8) and `src/data/vocab/level-1.json` (55 items in 5 topic units, words and phrases, all `verified: false`). Nouns are stored without the article plus `gender`; `displayPt()` adds o/a. `alternatives` lists other accepted answers; `blank` is the gap word in the example sentence.
  - Casual pt-PT is the default (*desculpa*, *como estás?*); the polite form is in `alternatives` or the note. Polite forms stay where they're natural (waiter, strangers).
  - Each unit: Flashcards (spaced repetition, `src/lib/srs.js`), Multiple choice (Portuguese to English, English to Portuguese, fill the gap), Type it (from English). Wrong answers return at the end of a session; green tick / red cross feedback.
  - Marking (`src/lib/answers.js`): ignores capitals, punctuation and missing accents (shows the right spelling), nouns with or without article; anything else only if listed in `alternatives`. Never guesses.
  - **Level 2** ("Everyday life", added 27 October 2026): `src/data/vocab/level-2.json`, 54 items in 5 units (restaurant, shopping, asking the way, home and routine, days and plans), more phrases than Level 1. All `verified: false`.
  - **Word order** (per level, `src/pages/vocab/WordOrderSession.jsx`): tap word tiles to build every phrase of 3+ words in the level. Only fixed phrases are used, so one order is right; any other natural order must be listed in `alternatives` (done for the "por favor" / "obrigado" / time-first variants). Best score saved per level in `vocab.order`. It doesn't touch spaced repetition. Also used in the middle part of the level test.
  - Level test: 20 questions getting harder (choice, typed gap, typing), marked at the end (silent on purpose, user agreed). 80% passes and opens the next level permanently. Retake any time. From Level 2 on, a quarter of questions come from earlier levels.
- **Reading:** `src/data/reading/level-1.json`, 3 texts (café, family, station). Every word has a meaning in the text's `glossary` (tap to see it). Listen to the text, 3 comprehension questions, best score saved. All `verified: false`.
- **Speaking (built, switched off):** listen, speak into the mic, see which words the browser's recogniser picked up (`src/lib/recognition.js`). Honest labels: transcription only, not a pronunciation score; audio goes to Google/Microsoft in Chrome/Edge. It could not be tried with a real mic (the agent's preview pane blocks microphones), so the user asked to lock it. Turn it on with `speakingReady` in `src/App.jsx` and `ready` for Speaking in `src/pages/Dashboard.jsx`.
- **Grammar:** grouped into stages (`src/lib/grammar.js` lists one JSON file per stage; topics are numbered straight through). Stage "Building blocks" (`basics.json`, 4 topics: gender and plurals, contractions do/na/ao/pelo, possessives, este/esse/aquele) uses `"focus": "word"` so practice says "missing word" and each drill gives its own `hint`; tables can set `listen` ("form" or "both") and `caption`. Stage "Past tense" (`past.json`, 5 perfeito topics: -ar, -er/-ir, fui/tive/estive, fiz/disse/vi/dei, vim/pus/pude/quis; then `imperfect.json`, 4 imperfeito topics: regular, era/tinha/estava/ia, perfeito vs imperfeito, estava a + polite queria/podia/gostava) adds a `rewrite` drill: shows `from` (a present sentence, labelled "Now:") and asks for the past form in the gap. Stage "Everyday patterns" (`patterns.json`, 4 topics: reflexive verbs, estar a + verb, verb + verb patterns such as tenho de / costumo / preciso de, ficar). Stage "Present tense" (`present.json`), 15 topics: ser, estar, ser or estar?, ter, ir, regular -ar/-er/-ir, fazer, poder, querer, then irregular groups (ver/dar/ler, dizer/trazer/saber, vir/pôr, pedir/ouvir/dormir/sair). Topics with several verbs use `tables` (one per verb, with meaning) instead of `table`; each drill names its verb with a `verb` field and can list accepted spellings in `alternatives` (e.g. oiço, lêem). Each topic: explanation, verb table with Listen, examples, pt-PT notes, then practice (type the form, type the verb in a sentence, pick ser/estar with a reason). Every drill is written by hand in the data; nothing is generated. No vós; você included with a note on how it sounds in Portugal. All `verified: false`.
- **Menu:** 6 items (Home, Vocab, Speaking, Reading, Grammar, Slang); the user chose to keep Speaking visible while it's switched off.
- **Slang:** `src/data/slang/pt-pt.json`, 29 expressions in groups (everyday chat, describing, people, café and bar with Lisbon/Porto words, exclamations, Portugal vs Brazil false friends, swear words). Each has formality and region tags, an example with Listen, and `confidence`; medium confidence shows a "Not sure: ask your native speaker" tag. Swear words are hidden until "Show swear words" is switched on, and are never in the quiz. Quiz: 10 random "what does it mean?" questions; wrong options never share a main word with the right one. All `verified: false`.

- **Auto-next** (`src/components/AutoNext.jsx`, user request 27 October 2026): after an answer is marked, vocab multiple choice, typing, word order, grammar practice and the slang quiz move on by themselves (1 s when right, 3 s when wrong or accent-only; user found 1.5/4 s too slow) with a shrinking bar and a Pause button. Listen also pauses. Next/Enter still work. The level test and flashcards are unchanged.

## Progress data
Saved in `localStorage` (key `pt-app-progress-v1`), included in the backup file: `days`, `practisedPhrases`, `cards` (spaced repetition per vocab item), `vocab` (`passedLevels`, `tests`, best `choice`/`typing` scores per unit), `reading` (best score per text), `grammar` (best practice score per topic), `slang` (best quiz score).

## Next
1. **Grammar roadmap to B1** (agreed 27 October 2026; one batch of ~4 topics at a time so the native speaker can keep up). Done: batch 1 (irregular presents), batch 2 (building blocks), batch 3 (everyday patterns), batch 4 (past tense, with the rewrite drill), batch 5 (imperfeito), all 27 October 2026. Next, in order: (6) pronoun placement (vejo-te / não te vejo), reusing the Vocab word tiles; (7) imperative; (8) future and conditional (and ir + verb); (9) tenho feito; (10) subjunctive: present, imperfect, future; (11) personal infinitive; (12) por/para, relative pronouns. Each new batch is a new stage file. Don't label anything with CEFR levels in the app.
2. **Slang, more expressions** once the native speaker has checked the first batch (never invent slang; mark anything unsure).
3. **Vocab Level 3** when the user asks (Level 2 and word order done).
4. Try Speaking with a real microphone in Chrome or Edge, then switch it back on.

## Still pending for the user
- Install a **Portuguese (Portugal)** voice: Windows Settings > Time & language > Speech, then restart the browser.
- Native speaker review of all content (`verified: false` everywhere). Worth checking first: *um café* = espresso, *se faz favor*, *torrada*, *ao balcão*, *só vem a casa ao fim de semana*.

## Practical notes (Windows)
- Run the app with `npm.cmd run dev`, then open http://localhost:5173. Plain `npm` is blocked by PowerShell's script policy; the user chose not to change it.
- URLs use a hash: `http://localhost:5173/#/vocab`, not `/vocab`.
- If the dev server shows a blank page or old content after edits (it once kept serving an old `grammar.js` after a new data file was added), restart it; Vite's hot reload can get stuck on a half-edited file.
- Git identity: `ayaanthakrar09@gmail.com` / `ayaanthakrar09-jpg`. The agent can commit; **pushing needs the user's signed-in shell** (Terminal panel).
- Branch `main`. Test, review the diff, commit, then push when the user says so. The old `vocab-draft` branch is superseded (its spaced repetition was reused).
- Check UI changes in the browser pane at desktop and phone widths. Clean up test progress in the pane's `localStorage` afterwards.

## Later
- **AI tutor:** needs a paid API and a small server to hold the key.
