import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { speak, speechMessages } from "../../lib/speech";
import { dateKey } from "../../lib/storage";
import { RATINGS, dueCards, intervalLabel, markKnown, newCards, rate } from "../../lib/srs";
import { displayPt, findUnit, genderText, isLevelOpen, openItems } from "../../lib/vocab";

const ratingText = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };

// One component for both a unit's flashcards (/vocab/unit/:unitId) and the review of due items (/vocab/review).
// The key starts a fresh session when you move from one unit straight to another.
export default function FlashcardSession(props) {
  const { unitId } = useParams();
  return <Session key={unitId ?? "review"} unitId={unitId} {...props} />;
}

function Session({ progress, updateProgress, review = false, unitId }) {
  const unit = review ? null : findUnit(unitId);
  const passed = progress.vocab.passedLevels;
  const today = dateKey();

  // The queue is fixed when the session opens: due items first, then (in a unit) the ones not seen yet.
  const [queue, setQueue] = useState(() => {
    if (review) return dueCards(openItems(passed), progress.cards, today);
    if (!unit) return [];
    return [...dueCards(unit.items, progress.cards, today), ...newCards(unit.items, progress.cards)];
  });
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, again: 0 });
  const [voiceNote, setVoiceNote] = useState("");

  function record(item, card) {
    updateProgress((previous) => ({
      ...previous,
      cards: { ...previous.cards, [item.id]: card },
      days: previous.days.includes(today) ? previous.days : [...previous.days, today],
    }));
  }

  function answer(rating) {
    const item = queue[0];
    record(item, rate(progress.cards[item.id], rating, today));
    setStats((s) => ({ reviewed: s.reviewed + 1, again: s.again + (rating === "again" ? 1 : 0) }));
    // An item rated Again goes to the back of this session so you see it again.
    setQueue((q) => (rating === "again" ? [...q.slice(1), item] : q.slice(1)));
    setRevealed(false);
  }

  function alreadyKnown() {
    record(queue[0], markKnown(today));
    setQueue((q) => q.slice(1));
    setRevealed(false);
  }

  async function say(text) {
    const result = await speak(text);
    setVoiceNote(result === "ok" ? "" : speechMessages[result]);
  }

  // Keyboard shortcuts: Space shows the answer, 1-4 rate it.
  useKeyListener((event) => {
    if (!queue.length || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === " " && !revealed && event.target.tagName !== "BUTTON") {
      event.preventDefault();
      setRevealed(true);
    } else if (revealed && ["1", "2", "3", "4"].includes(event.key)) {
      answer(RATINGS[Number(event.key) - 1]);
    }
  });

  if (!review && (!unit || !isLevelOpen(unit.level, passed))) return <Navigate to="/vocab" replace />;
  const backTo = review ? "/vocab" : `/vocab/level/${unit.level}`;
  const backText = review ? "Back to Vocab" : `Back to Level ${unit.level}`;

  /* ---------- Finished, or nothing to do ---------- */
  if (queue.length === 0) {
    return (
      <section className="page">
        <h1 className="page-title">{stats.reviewed ? "Session complete" : "Nothing to review"}</h1>
        <div className="card">
          <p>
            {stats.reviewed
              ? `You went through ${stats.reviewed} ${stats.reviewed === 1 ? "card" : "cards"} and rated ${stats.again} Again.`
              : "Everything here is up to date. Items come back on the day they're due."}
          </p>
          <div className="actions">
            <Link to={backTo} className="btn btn-primary">{backText}</Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- Card ---------- */
  const item = queue[0];
  const isNew = !progress.cards[item.id];
  const detail = [item.type, genderText[item.gender], item.formality].filter(Boolean).join(", ");

  return (
    <section className="page">
      <div className="session-bar">
        <Link to={backTo} className="btn btn-quiet">End session</Link>
        <span className="muted">{queue.length} left</span>
      </div>

      <div className="flashcard">
        <span className="chip">{review ? `Level ${item.level} review` : unit.title}</span>
        <h1 className="flash-word" lang="pt-PT">{displayPt(item)}</h1>
        <button className="btn btn-icon" onClick={() => say(displayPt(item))} aria-label={`Listen to ${displayPt(item)}`}>
          <Icon name="speaker" />
        </button>

        {revealed ? (
          <div className="flash-back">
            <p className="flash-english">{item.en}</p>
            <p className="muted">{detail}</p>
            <div className="example">
              <button className="btn btn-icon btn-small" onClick={() => say(item.example.pt)} aria-label="Listen to the example sentence">
                <Icon name="speaker" size={16} />
              </button>
              <div>
                <p lang="pt-PT">{item.example.pt}</p>
                <p className="muted">{item.example.en}</p>
              </div>
            </div>
            {item.note && <p className="note">{item.note}</p>}
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
              <span className="rate-next">{intervalLabel(progress.cards[item.id], rating, today)}</span>
              <span className="visually-hidden">Shortcut {index + 1}</span>
            </button>
          ))}
        </div>
      )}

      <div className="session-foot">
        {isNew && <button className="btn btn-quiet" onClick={alreadyKnown}>I already know this</button>}
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
