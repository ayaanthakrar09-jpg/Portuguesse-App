import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import phrases from "../data/phrases.json";
import { stages, topics } from "../lib/grammar";
import { texts } from "../lib/reading";
import { speak, speechMessages } from "../lib/speech";
import { dueCards, learnedCount } from "../lib/srs";
import { currentStreak, dateKey, exportBackup, readBackup } from "../lib/storage";
import { allItems, isLevelOpen, levels, openItems } from "../lib/vocab";
import { QUIZ_LENGTH } from "./slang/SlangQuiz";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 20) return "Boa tarde";
  return "Boa noite";
}

// One phrase per calendar day, cycling through the list.
function phraseOfTheDay() {
  const dayNumber = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
  return phrases[dayNumber % phrases.length];
}

// The last 7 days, oldest first, each marked if you practised that day.
function lastSevenDays(days) {
  const practised = new Set(days);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      key: dateKey(date),
      label: date.toLocaleDateString("en-GB", { weekday: "short" }),
      done: practised.has(dateKey(date)),
    };
  });
}

// Browser storage for small per-device touches (the once-a-day intro, which wall tiles you've seen).
// It can be unavailable, so every read and write is allowed to fail quietly.
function remember(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    return null;
  }
  return value;
}

// Up to three suggestions for what to do next, most urgent first.
function nextSteps(progress, today) {
  const steps = [];
  const passed = progress.vocab.passedLevels;
  const due = dueCards(openItems(passed), progress.cards, today).length;
  if (due > 0) steps.push({ to: "/vocab/review", title: `Review ${due} ${due === 1 ? "flashcard" : "flashcards"}`, detail: "Due today, so they stick" });

  const openLevels = levels.filter((level) => isLevelOpen(level.id, passed));
  const unit = openLevels.flatMap((level) => level.units).find((u) => u.items.some((item) => !progress.cards[item.id]));
  if (unit) steps.push({ to: `/vocab/unit/${unit.id}`, title: unit.title, detail: `Vocab, level ${unit.level}` });
  else {
    const untested = openLevels.find((level) => !passed.includes(level.id));
    if (untested) steps.push({ to: `/vocab/level/${untested.id}/test`, title: `Level ${untested.id} test`, detail: "Vocab: pass it to open the next level" });
  }

  const topic = topics.find((t) => !progress.grammar?.[t.id]);
  if (topic) {
    const stage = stages.find((s) => s.topics.includes(topic));
    steps.push({ to: `/grammar/${topic.id}`, title: topic.title, pt: true, detail: `Grammar, ${stage.title.toLowerCase()}` });
  }
  return steps.slice(0, 3);
}

// The learning areas, each with a one-line summary of where you are.
function areas(progress) {
  const practised = topics.filter((t) => progress.grammar?.[t.id]).length;
  const read = texts.filter((t) => progress.reading?.[t.id]).length;
  return [
    { to: "/vocab", label: "Vocab", icon: "vocab", status: `${learnedCount(progress.cards)} of ${allItems.length} learned` },
    { to: "/grammar", label: "Grammar", icon: "grammar", status: `${practised} of ${topics.length} practised` },
    { to: "/reading", label: "Reading", icon: "reading", status: `${read} of ${texts.length} read` },
    { to: "/slang", label: "Slang", icon: "slang", status: progress.slang ? `Best quiz ${progress.slang.best}/${QUIZ_LENGTH}` : "Quiz not taken yet" },
    { to: "/speaking", label: "Speaking", icon: "speaking", status: "Switched off for now", soon: true },
  ];
}

export default function Dashboard({ progress, updateProgress }) {
  const phrase = phraseOfTheDay();
  const today = dateKey();
  const practisedToday = progress.days.includes(today);
  const [voiceNote, setVoiceNote] = useState("");
  const [backupNote, setBackupNote] = useState("");
  const fileInput = useRef(null);
  // The tiles behind today's phrase fill in on the first visit of the day only.
  const [intro] = useState(() => remember("pt-app-intro") !== today);
  useEffect(() => { remember("pt-app-intro", today); }, [today]);

  async function listen() {
    const result = await speak(phrase.pt);
    setVoiceNote(result === "ok" ? "" : speechMessages[result]);
  }

  function markPractised() {
    if (practisedToday) return;
    updateProgress((previous) => ({
      ...previous,
      days: [...previous.days, today],
      practisedPhrases: previous.practisedPhrases + 1,
    }));
  }

  async function restore(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      updateProgress(await readBackup(file));
      setBackupNote("Backup restored.");
    } catch (error) {
      setBackupNote(error.message);
    }
  }

  const steps = nextSteps(progress, today);

  return (
    <div className="home">
      <section className="page home-main">
        <header className="page-head">
          <h1 className="page-title" lang="pt-PT">{greeting()}!</h1>
          <p className="muted">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </header>

        <div className={`hero ${intro ? "is-intro" : ""}`}>
          <HeroTiles />
          <p className="hero-label">Today's phrase</p>
          <p className="hero-phrase" lang="pt-PT">{phrase.pt}</p>
          <p className="hero-translation">{phrase.en}</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={listen}>
              <Icon name="speaker" /> Listen
            </button>
            <button className="btn" onClick={markPractised} disabled={practisedToday}>
              <Icon name="check" /> {practisedToday ? "Practised today" : "I said it out loud"}
            </button>
          </div>
          {voiceNote && <p className="note" role="status">{voiceNote}</p>}
          <p className="note">Not yet checked by a native speaker.</p>
        </div>

        {steps.length > 0 && (
          <div className="card next-steps">
            <h2 className="card-title">Carry on</h2>
            <ul className="next-list">
              {steps.map((step) => (
                <li key={step.to}>
                  <Link to={step.to} className="next-row">
                    <span className="next-body">
                      <span className="next-title" lang={step.pt ? "pt-PT" : undefined}>{step.title}</span>
                      <span className="muted">{step.detail}</span>
                    </span>
                    <Icon name="chevron" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="areas">
          {areas(progress).map((area) => (
            <li key={area.to}>
              <Link to={area.to} className={`area ${area.soon ? "is-soon" : ""}`}>
                <span className="area-icon"><Icon name={area.icon} size={22} /></span>
                <span className="area-label">{area.label}</span>
                <span className="area-status">{area.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside className="home-side">
        <div className="panel">
          <h2 className="card-title">Your progress</h2>
          <div className="side-stats">
            <div className="side-stat"><span className="stat-value">{currentStreak(progress.days)}</span><span className="stat-label">day streak</span></div>
            <div className="side-stat"><span className="stat-value">{learnedCount(progress.cards)}</span><span className="stat-label">words learned</span></div>
            <div className="side-stat"><span className="stat-value">{progress.practisedPhrases}</span><span className="stat-label">phrases practised</span></div>
          </div>
          <ul className="week">
            {lastSevenDays(progress.days).map((day) => (
              <li key={day.key} className={day.done ? "day done" : "day"}>
                <span className="day-dot" aria-hidden="true" />
                <span>{day.label}</span>
                <span className="visually-hidden">{day.done ? "practised" : "not practised"}</span>
              </li>
            ))}
          </ul>
        </div>

        <TileWall progress={progress} />

        <div className="panel">
          <h2 className="card-title">Back up your progress</h2>
          <p className="muted">
            Progress is saved only in this browser. Clearing browser data erases it, so download a backup now and then.
          </p>
          <div className="actions">
            <button className="btn" onClick={() => exportBackup(progress)}>
              <Icon name="download" /> Download backup
            </button>
            <button className="btn" onClick={() => fileInput.current.click()}>
              <Icon name="upload" /> Restore from file
            </button>
            <input ref={fileInput} type="file" accept="application/json" onChange={restore} hidden />
          </div>
          {backupNote && <p className="note" role="status">{backupNote}</p>}
        </div>
      </aside>
    </div>
  );
}

// The azulejo tiles behind today's phrase. Each tile's delay makes them sweep in from the right on the intro.
const HERO_COLUMNS = 10;
const HERO_ROWS = 7;

function HeroTiles() {
  return (
    <div className="hero-tiles" aria-hidden="true">
      {Array.from({ length: HERO_COLUMNS * HERO_ROWS }, (_, i) => {
        const column = i % HERO_COLUMNS;
        const row = Math.floor(i / HERO_COLUMNS);
        return <span key={i} style={{ "--delay": `${(HERO_COLUMNS - 1 - column + row) * 35}ms` }} />;
      })}
    </div>
  );
}

// One tile for each grammar topic practised and each vocab unit fully learned.
// Tiles added since your last visit to Home turn over into place.
function TileWall({ progress }) {
  const pieces = [
    ...levels.flatMap((level) => level.units).map((unit) => ({
      id: unit.id,
      done: unit.items.every((item) => progress.cards[item.id]?.reps > 0),
    })),
    ...topics.map((topic) => ({ id: topic.id, done: Boolean(progress.grammar?.[topic.id]) })),
  ];
  const doneIds = pieces.filter((piece) => piece.done).map((piece) => piece.id);
  const [seen] = useState(() => {
    try {
      return new Set(JSON.parse(remember("pt-app-wall-seen") ?? "[]"));
    } catch {
      return new Set();
    }
  });
  useEffect(() => { remember("pt-app-wall-seen", JSON.stringify(doneIds)); });

  // Finished tiles fill the wall from the top-left, so it grows like a real tiled wall.
  let order = 0;
  const fresh = doneIds.filter((id) => !seen.has(id));
  return (
    <div className="panel">
      <h2 className="card-title">Your tile wall</h2>
      <p className="muted">A tile for every grammar topic you practise and every vocab unit you learn. {doneIds.length} of {pieces.length} so far.</p>
      <div className="wall" aria-hidden="true">
        {pieces.map((piece, i) => {
          const filled = i < doneIds.length;
          const isNew = filled && i >= doneIds.length - fresh.length;
          const delay = isNew ? `${(order += 1) * 90}ms` : undefined;
          return <span key={piece.id} className={`wall-tile ${filled ? "is-filled" : ""} ${isNew ? "is-new" : ""}`} style={delay ? { "--delay": delay } : undefined} />;
        })}
      </div>
    </div>
  );
}
