# Azulejo: a European Portuguese (pt-PT) learning app

**Start here:** read `HANDOFF.md` for the current status and what to do next.

## Goal
Web app to learn **European Portuguese** (never Brazilian). Five areas: Vocab (levels, flashcards, exercises, spaced repetition), Speaking (listen, repeat into mic, compare), Reading (short texts, tap-to-translate, questions), Grammar (short explanations plus drills, starting with the present tense), Slang (labelled expressions). CEFR levels are out of scope until later. An AI tutor exists, using the learner's own free Gemini API key (see `HANDOFF.md`).

## Stack
React + Vite, JavaScript, plain CSS (variables, dark theme default), JSON content files, `localStorage` for progress. Keep dependencies minimal. No database or login yet.

## Content rules
- pt-PT only: *tu*, *autocarro*, *pequeno-almoço*, *telemóvel*. No *ônibus*, *café da manhã*, *celular*.
- Every vocab/slang/reading item has `"verified": false` until the user's native speaker confirms it.
- Never invent slang. Label formality (formal/informal/rude) and region. If unsure, say so.
- Content lives in JSON under `src/data/`, in small batches (~40 items) so review is easy.
- Speech: browser `speechSynthesis` (pt-PT) and `SpeechRecognition` (Chrome/Edge). It transcribes only; never claim it scores pronunciation.

## Working style
- User is a beginner and wants to learn AI use more than coding. Explain decisions briefly in plain English. No line-by-line explanations unless asked.
- Push back on ideas that are not credible. Do not show buttons or pages that do nothing.
- Be economical: don't re-read large files or rewrite working code without reason.
- UI: dark charcoal, restrained accent, rounded cards, no gradient clutter. Use the frontend-design skill. Check results in the browser at phone and desktop widths.

## Git
- Branch: `main`. Test a milestone, review the diff, commit with a clear message, then push.
- Never commit secrets (`.env`, API keys). The app never contains a key; each learner pastes their own. Ask before any destructive Git command.
