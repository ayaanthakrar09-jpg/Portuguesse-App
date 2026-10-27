import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AutoNextControl, useAutoNext } from "../../components/AutoNext";
import Icon from "../../components/Icon";
import { markAnswer } from "../../lib/answers";
import { orderItems, orderedText, orderQuestion, shuffle, withBestScore } from "../../lib/exercises";
import { speak, speechMessages } from "../../lib/speech";
import { dateKey } from "../../lib/storage";
import { findLevel, isLevelOpen } from "../../lib/vocab";
import { QuestionPrompt, ResultMark, WordTiles } from "./Questions";
import SessionResult from "./SessionResult";

// Put the words in order, for every phrase of three or more words in a level.
// It practises sentence building, so it doesn't change the spaced-repetition schedule.
export default function WordOrderSession(props) {
  const { levelId } = useParams();
  return <Session key={levelId} levelId={levelId} {...props} />;
}

function newQueue(level) {
  return shuffle(orderItems(level)).map(orderQuestion);
}

function Session({ progress, updateProgress, levelId }) {
  const level = findLevel(levelId);
  const [queue, setQueue] = useState(() => (level ? newQueue(level) : []));
  const [chosen, setChosen] = useState([]);
  const [result, setResult] = useState(null); // null while building, then "correct" | "wrong"
  const [missed, setMissed] = useState([]); // items wrong at the first attempt
  const [voiceNote, setVoiceNote] = useState("");
  const auto = useAutoNext(Boolean(result), result === "correct", next);

  if (!level || !isLevelOpen(level.id, progress.vocab.passedLevels)) return <Navigate to="/vocab" replace />;
  // Scores are kept per level, in the same shape as the per-unit exercise scores.
  const scoreUnit = { id: level.id, level: level.id, items: orderItems(level) };
  const question = queue[0];

  function check(event) {
    event.preventDefault();
    if (result) return next();
    if (chosen.length < question.tiles.length) return;
    const outcome = markAnswer(orderedText(question, chosen), question.item) === "wrong" ? "wrong" : "correct";
    setResult(outcome);
    if (outcome === "wrong" && !missed.some((m) => m.id === question.item.id)) setMissed((m) => [...m, question.item]);
    const today = dateKey();
    updateProgress((previous) => (previous.days.includes(today) ? previous : { ...previous, days: [...previous.days, today] }));
  }

  function next() {
    // A wrong answer comes back at the end, with the tiles mixed again.
    const rest = queue.slice(1);
    const nextQueue = result === "wrong" ? [...rest, orderQuestion(question.item)] : rest;
    setQueue(nextQueue);
    setChosen([]);
    setResult(null);
    if (nextQueue.length === 0) {
      updateProgress((previous) => withBestScore(previous, "order", scoreUnit, scoreUnit.items.length - missed.length));
    }
  }

  async function say(text) {
    auto.pause();
    const outcome = await speak(text);
    setVoiceNote(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  /* ---------- Finished ---------- */
  if (!question) {
    return (
      <SessionResult
        unit={scoreUnit}
        missed={missed}
        againText="Build them again"
        onAgain={() => { setQueue(newQueue(level)); setMissed([]); }}
      />
    );
  }

  /* ---------- Question ---------- */
  const complete = chosen.length === question.tiles.length;
  return (
    <section className="page">
      <div className="session-bar">
        <Link to={`/vocab/level/${level.id}`} className="btn btn-quiet">End session</Link>
        <span className="muted">{queue.length} left</span>
      </div>

      <form className="flashcard" onSubmit={check}>
        <span className="chip">Level {level.id}: word order</span>
        <QuestionPrompt question={question} />
        <WordTiles question={question} chosen={chosen} onChange={setChosen} result={result} />
        <button type="submit" className="btn btn-primary" disabled={!complete}>{result ? "Next" : "Check"}</button>

        {result && (
          <div className={`feedback is-${result}`} role="status">
            <p className="feedback-title">
              <ResultMark ok={result === "correct"} />
              {result === "correct" ? "Correct" : "Not quite"}
            </p>
            <div className="example">
              <button type="button" className="btn btn-icon btn-small" onClick={() => say(question.answer)} aria-label={`Listen to ${question.answer}`}>
                <Icon name="speaker" size={16} />
              </button>
              <div>
                <p lang="pt-PT">{question.answer}</p>
                <p className="muted">{question.item.en}</p>
              </div>
            </div>
            {question.item.note && <p className="note">{question.item.note}</p>}
            <AutoNextControl auto={auto} />
          </div>
        )}
      </form>

      <div className="session-foot">
        {voiceNote && <p className="note" role="status">{voiceNote}</p>}
        <p className="note">Tap a word to add it, tap it again to take it back. After checking it moves on by itself; Pause stops it. Wrong answers come back at the end.</p>
      </div>
    </section>
  );
}
