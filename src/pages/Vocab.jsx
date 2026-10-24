import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import vocab from "../data/vocab.json";
import { speak, speechMessages } from "../lib/speech";
import { dateKey } from "../lib/storage";
import { NEW_PER_SESSION, RATINGS, dueCards, intervalLabel, learnedCount, markKnown, newCards, rate } from "../lib/srs";

const ratingText = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };
const genderText = { m: "masculine", f: "feminine" };

export default function Vocab({ progress, updateProgress }) {
  const today = dateKey();
  const [queue, setQueue] = useState(null); // null = overview screen, array = review session
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, again: 0 });
  const [voiceNote, setVoiceNote] = useState("");

  const due = dueCards(vocab, progress.cards, today);
  const fresh = newCards(vocab, progress.cards).slice(0, NEW_PER_SESSION);

  function start() {
    setQueue([...due, ...fresh]);
    setRevealed(false);
    setStats({ reviewed: 0, again: 0 });
  }

  async function say(text) {
    const result = await speak(text);
    setVoiceNote(result === "ok" ? "" : speechMessages[result]);
  }

  function answer(rating) {
    const word = queue[0];
    updateProgress((previous) => ({
      ...previous,
      cards: { ...previous.cards, [word.id]: rate(previous.cards[word.id], rating, today) },
      days: previous.days.includes(today) ? previous.days : [...previous.days, today],
    }));
    setStats((s) => ({ reviewed: s.reviewed + 1, again: s.again + (rating === "again" ? 1 : 0) }));
    // A card you got wrong goes to the back of this session so you see it again.
    setQueue((q) => (rating === "again" ? [...q.slice(1), word] : q.slice(1)));
    setRevealed(false);
  }

  function alreadyKnown() {
    const word = queue[0];
    updateProgress((previous) => ({
      ...previous,
      cards: { ...previous.cards, [word.id]: markKnown(today) },
      days: previous.days.includes(today) ? previous.days : [...previous.days, today],
    }));
    setQueue((q) => q.slice(1));
    setRevealed(false);
  }

  // Keyboard shortcuts: Space shows the answer, 1-4 rate it.
  const handleKey = (event) => {
    if (!queue?.length || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === " " && !revealed && event.target.tagName !== "BUTTON") {
      event.preventDefault();
      setRevealed(true);
    } else if (revealed && ["1", "2", "3", "4"].includes(event.key)) {
      answer(RATINGS[Number(event.key) - 1]);
    }
  };
  useKeyListener(handleKey);

  /* ---------- Overview ---------- */
  if (queue === null) {
    const nothingToDo = due.length + fresh.length === 0;
    return (
      <section className="page">
        <h1 className="page-title">Vocab</h1>
        <div className="card">
          <div className="stats stats-3">
            <div className="stat"><span className="stat-value">{due.length}</span><span className="stat-label">due for review</span></div>
            <div className="stat"><span className="stat-value">{fresh.length}</span><span className="stat-label">new words ready</span></div>
            <div className="stat"><span className="stat-value">{learnedCount(progress.cards)}</span><span className="stat-label">of {vocab.length} learned</span></div>
          </div>
          {nothingToDo ? (
            <p className="muted">You're all caught up. Come back tomorrow, or when more words are added.</p>
          ) : (
            <div className="actions">
              <button className="btn btn-primary" onClick={start}>Start session</button>
            </div>
          )}
          <p className="note">
            Words you rate Again come back in the same session. Easier ratings push the next review further away.
            All {vocab.length} words are marked as not yet checked by a native speaker.
          </p>
        </div>
      </section>
    );
  }

  /* ---------- Finished ---------- */
  if (queue.length === 0) {
    return (
      <section className="page">
        <h1 className="page-title">Session complete</h1>
        <div className="card">
          <p>
            You reviewed {stats.reviewed} {stats.reviewed === 1 ? "card" : "cards"} and rated {stats.again} Again.
          </p>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setQueue(null)}>Back to Vocab</button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- Card ---------- */
  const word = queue[0];
  const isNew = !progress.cards[word.id];
  const detail = [word.pos, genderText[word.gender]].filter(Boolean).join(" · ");

  return (
    <section className="page">
      <div className="session-bar">
        <button className="btn btn-quiet" onClick={() => setQueue(null)}>End session</button>
        <span className="muted">{queue.length} left</span>
      </div>

      <div className="flashcard">
        <span className="chip">{word.topic}</span>
        <h1 className="flash-word" lang="pt-PT">{word.pt}</h1>
        <button className="btn btn-icon" onClick={() => say(word.pt)} aria-label={`Listen to ${word.pt}`}>
          <Icon name="speaker" />
        </button>

        {revealed ? (
          <div className="flash-back">
            <p className="flash-english">{word.en}</p>
            {detail && <p className="muted">{detail}</p>}
            <div className="example">
              <button className="btn btn-icon btn-small" onClick={() => say(word.example.pt)} aria-label="Listen to the example sentence">
                <Icon name="speaker" size={16} />
              </button>
              <div>
                <p lang="pt-PT">{word.example.pt}</p>
                <p className="muted">{word.example.en}</p>
              </div>
            </div>
            {word.note && <p className="note">{word.note}</p>}
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setRevealed(true)}>Show answer</button>
        )}
      </div>

      {revealed && (
        <div className="ratings">
          {RATINGS.map((rating, index) => (
            <button key={rating} className={`btn rate rate-${rating}`} onClick={() => answer(rating)}>
              <span>{ratingText[rating]}</span>
              <span className="rate-next">{intervalLabel(progress.cards[word.id], rating, today)}</span>
              <span className="visually-hidden">Shortcut {index + 1}</span>
            </button>
          ))}
        </div>
      )}

      <div className="session-foot">
        {isNew && (
          <button className="btn btn-quiet" onClick={alreadyKnown}>I already know this word</button>
        )}
        {voiceNote && <p className="note" role="status">{voiceNote}</p>}
        <p className="note">Shortcuts: Space shows the answer, then 1 to 4 to rate. Not yet checked by a native speaker.</p>
      </div>
    </section>
  );
}

// Attaches a key listener for as long as the page is open.
function useKeyListener(handler) {
  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
}
