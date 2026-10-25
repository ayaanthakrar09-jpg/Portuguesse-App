import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { markAnswer } from "../../lib/answers";
import { shuffle, typeQuestion, withBestScore } from "../../lib/exercises";
import { speak, speechMessages } from "../../lib/speech";
import { dateKey } from "../../lib/storage";
import { rate } from "../../lib/srs";
import { findUnit, isLevelOpen } from "../../lib/vocab";
import { AnswerField, QuestionPrompt, ResultMark, typeHint } from "./Questions";
import SessionResult from "./SessionResult";

// The key starts a fresh session when you move from one unit straight to another.
export default function TypingSession(props) {
  const { unitId } = useParams();
  return <Session key={unitId} unitId={unitId} {...props} />;
}

function Session({ progress, updateProgress, unitId }) {
  const unit = findUnit(unitId);
  const today = dateKey();
  const [queue, setQueue] = useState(() => (unit ? shuffle(unit.items) : []));
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null); // null while typing, then "correct" | "accent" | "wrong"
  const [missed, setMissed] = useState([]); // items wrong at the first attempt
  const [voiceNote, setVoiceNote] = useState("");
  const input = useRef(null);

  if (!unit || !isLevelOpen(unit.level, progress.vocab.passedLevels)) return <Navigate to="/vocab" replace />;
  const backTo = `/vocab/level/${unit.level}`;

  function check(event) {
    event.preventDefault();
    if (result) return next();
    if (!typed.trim()) return;
    const item = queue[0];
    const outcome = markAnswer(typed, item);
    setResult(outcome);

    // Only the first attempt in a session counts. A wrong answer always brings the item back sooner;
    // a right one only moves the schedule if the item was new or due, so repeat practice can't inflate it.
    const firstTry = !missed.some((m) => m.id === item.id);
    const card = progress.cards[item.id];
    const rating = outcome === "wrong" ? "again" : outcome === "accent" ? "hard" : "good";
    const shouldRate = firstTry && (outcome === "wrong" || !card || card.due <= today);
    updateProgress((previous) => ({
      ...previous,
      cards: shouldRate ? { ...previous.cards, [item.id]: rate(previous.cards[item.id], rating, today) } : previous.cards,
      days: previous.days.includes(today) ? previous.days : [...previous.days, today],
    }));
    if (outcome === "wrong" && firstTry) setMissed((m) => [...m, item]);
  }

  function next() {
    const item = queue[0];
    const rest = queue.slice(1);
    // Wrong answers go to the back of the queue: the session ends once each one has been typed correctly.
    const nextQueue = result === "wrong" ? [...rest, item] : rest;
    setQueue(nextQueue);
    setTyped("");
    setResult(null);
    if (nextQueue.length === 0) saveScore();
    else input.current?.focus();
  }

  function saveScore() {
    updateProgress((previous) => withBestScore(previous, "typing", unit, unit.items.length - missed.length));
  }

  async function say(text) {
    const outcome = await speak(text);
    setVoiceNote(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  /* ---------- Finished ---------- */
  if (queue.length === 0) {
    return (
      <SessionResult
        unit={unit}
        missed={missed}
        againText="Type them again"
        onAgain={() => { setQueue(shuffle(unit.items)); setMissed([]); }}
      />
    );
  }

  /* ---------- Question ---------- */
  const item = queue[0];
  const { answer } = typeQuestion(item);

  return (
    <section className="page">
      <div className="session-bar">
        <Link to={backTo} className="btn btn-quiet">End session</Link>
        <span className="muted">{queue.length} left</span>
      </div>

      <form className="flashcard" onSubmit={check}>
        <span className="chip">{unit.title}</span>
        <QuestionPrompt question={typeQuestion(item)} />
        <p className="muted">{typeHint(item)}</p>
        <AnswerField inputRef={input} value={typed} onChange={setTyped} result={result} buttonText={result ? "Next" : "Check"} />

        {result && (
          <div className={`feedback is-${result}`} role="status">
            <p className="feedback-title">
              <ResultMark ok={result !== "wrong"} />
              {result === "correct" ? "Correct" : result === "accent" ? "Correct, but check the accents" : "Not quite"}
            </p>
            {result !== "correct" && (
              <p>
                {result === "wrong" ? "The answer is " : "It's spelt "}
                <strong lang="pt-PT">{answer}</strong>
              </p>
            )}
            <div className="example">
              <button type="button" className="btn btn-icon btn-small" onClick={() => say(answer)} aria-label={`Listen to ${answer}`}>
                <Icon name="speaker" size={16} />
              </button>
              <div>
                <p lang="pt-PT">{item.example.pt}</p>
                <p className="muted">{item.example.en}</p>
              </div>
            </div>
            {item.note && <p className="note">{item.note}</p>}
          </div>
        )}
      </form>

      <div className="session-foot">
        {voiceNote && <p className="note" role="status">{voiceNote}</p>}
        <p className="note">Press Enter to check, then Enter again for the next one. Wrong answers come back at the end.</p>
      </div>
    </section>
  );
}
