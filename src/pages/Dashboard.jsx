import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import phrases from "../data/phrases.json";
import { speak, speechMessages } from "../lib/speech";
import { learnedCount } from "../lib/srs";
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

// The four learning areas. `ready` is false until that milestone is built.
const activities = [
  { to: "/vocab", label: "Vocab", icon: "vocab", color: "pink", ready: true },
  { to: "/speaking", label: "Speaking", icon: "speaking", color: "red", ready: false },
  { to: "/reading", label: "Reading", icon: "reading", color: "blue", ready: false },
  { to: "/slang", label: "Slang", icon: "slang", color: "yellow", ready: false },
];

export default function Dashboard({ progress, updateProgress }) {
  const phrase = phraseOfTheDay();
  const today = dateKey();
  const practisedToday = progress.days.includes(today);
  const [voiceNote, setVoiceNote] = useState("");
  const [backupNote, setBackupNote] = useState("");
  const fileInput = useRef(null);

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

  return (
    <div className="home">
      <section className="page home-main">
        <header className="page-head">
          <h1 className="page-title">{greeting()}!</h1>
          <p className="muted">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </header>

        <div className="hero">
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

        <div>
          <h2 className="section-title">Activities</h2>
          <ul className="activities">
            {activities.map((activity) => (
              <li key={activity.to}>
                <Link to={activity.to} className={`activity ${activity.ready ? "" : "is-soon"}`}>
                  <span className={`activity-circle c-${activity.color}`}><Icon name={activity.icon} size={26} /></span>
                  <span className="activity-label">{activity.label}</span>
                  {!activity.ready && <span className="activity-soon">Soon</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
