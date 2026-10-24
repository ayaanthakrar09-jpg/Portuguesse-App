# Prompt for the Vocab section (paste into a new chat in this project)

Read CLAUDE.md and HANDOFF.md in this project first. I'm a beginner at coding and want to learn how to use AI; keep explanations short and plain, and push back when my ideas aren't credible.

Task: plan, then build, the Vocab section of my European Portuguese (pt-PT) learning app. Do not create or edit any files until I approve your plan.

## Requirements

1. **Levels.** Vocab is organised into levels that get progressively harder. A level cannot be opened until the previous level's test is passed. Failed tests can be retaken without limit, and the result shows which items I missed.
2. **Units inside levels.** Each level has units, one topic each, with about 10 items. Topics may recur across levels at increasing difficulty (for example Food in Level 1 is single words, in Level 3 it is whole restaurant phrases). Store both a level and a topic tag on every item, so topic-based practice can be added later.
3. **Words AND phrases.** Vocab teaches both single words and whole phrases or sentence patterns (for example "Queria um café, por favor"). Every item has a type, `word` or `phrase`. Early levels are mostly words plus fixed phrases (greetings, ordering); later levels have more phrases and longer sentences.
4. **Exercises rise in difficulty within a level.**
   - Flashcards (recognition), for words and phrases.
   - Multiple choice and fill-in-the-blank with options.
   - Typed fill-in-the-blank.
   - Typing a word or phrase from its English meaning.
   - For phrases: put the words in order, and complete the missing word.
5. **Level test.** Each level ends with a test that mixes all exercise types plus items from earlier levels. The pass mark is configurable (start at 80%).
6. **Spaced repetition.** Items I get wrong come back more often, and earlier-level items reappear in later practice.
7. **Typing is accent-tolerant.** A missing accent is accepted but the correct spelling is shown. For phrases, also accept small harmless variations only if they are listed as valid alternatives in the data; never guess.
8. **No grammar lessons here** (a separate section comes later). Small notes on an item are fine: gender, article, common verb forms, formal or informal.
9. **Audio.** Use browser text-to-speech via `src/lib/speech.js`. Never claim pronunciation scoring.

## Content

- I will provide a dictionary (words, phrases, example sentences). Treat it as the source of truth. Never invent or alter entries. Mark everything `"verified": false` until my native speaker confirms it.
- Pure European Portuguese only.
- Start with ONE level (about 40 to 60 items) to prove the engine. More levels come as content arrives.

## Reuse

- The branch `vocab-draft` on GitHub has a first flashcard version (spaced repetition in `src/lib/srs.js`, a 40-word list, a flashcard page). Reuse what fits; don't keep it for its own sake.
- Keep the current green UI. Use the frontend-design skill and check results in the browser at phone and desktop widths.

## Process

1. Inspect the project and the `vocab-draft` branch.
2. Propose: the data format for levels, units, words and phrases; how progress and unlocks are stored (localStorage, with the existing backup); the screens; the file list; and milestones with a test after each.
3. Ask me anything you need, then wait for my approval.
4. Build one milestone at a time. Test it, then commit. Pushing needs my signed-in terminal, so ask me to push or use the Terminal panel.
