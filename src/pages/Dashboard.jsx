import { useRef, useState } from "react";
import Icon from "../components/Icon";
import phrases from "../data/phrases.json";
import { speak } from "../lib/speech";
import { currentStreak, dateKey, exportBackup, readBackup } from "../lib/storage";

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

export default function Dashboard({ progress, updateProgress }) {
  const phrase = phraseOfTheDay();
  const today = dateKey();
  const practisedToday = progress.days.includes(today);
  const [voiceNote, setVoiceNote] = useState("");
  const [backupNote, setBackupNote] = useState("");
  const fileInput = useRef(null);

  const cards = Object.values(progress.cards);
  const dueCount = cards.filter((card) => card.due <= today).length;

  async function listen() {
    const result = await speak(phrase.pt);
    if (result === "unsupported") setVoiceNote("This browser can't play speech. Try Chrome or Edge.");
    else if (result === "no-pt-pt-voice")
      setVoiceNote("No European Portuguese voice is installed on this device, so the accent may sound Brazilian.");
    else setVoiceNote("");
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

  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">{greeting()}</h1>
        <p className="muted">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      <div className="hero">
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

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{currentStreak(progress.days)}</span>
          <span className="stat-label">day streak</span>
        </div>
        <div className="stat">
          <span className="stat-value">{cards.length}</span>
          <span className="stat-label">words learned</span>
        </div>
        <div className="stat">
          <span className="stat-value">{dueCount}</span>
          <span className="stat-label">due for review</span>
        </div>
        <div className="stat">
          <span className="stat-value">{progress.practisedPhrases}</span>
          <span className="stat-label">phrases practised</span>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">This week</h2>
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

      <div className="card">
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
    </section>
  );
}
