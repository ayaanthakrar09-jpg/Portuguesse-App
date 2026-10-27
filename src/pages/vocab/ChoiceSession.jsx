import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AutoNextControl, useAutoNext } from "../../components/AutoNext";
import Icon from "../../components/Icon";
import { choiceQuestions, shuffle, withBestScore } from "../../lib/exercises";
import { speak, speechMessages } from "../../lib/speech";
import { dateKey } from "../../lib/storage";
import { rate } from "../../lib/srs";
import { displayPt, findUnit, isLevelOpen } from "../../lib/vocab";
import { Choices, QuestionPrompt, ResultMark } from "./Questions";
import SessionResult from "./SessionResult";
import SessionProgress from "../../components/SessionProgress";
import RichText from "../../components/RichText";

// The key starts a fresh session when you move from one unit straight to another.
export default function ChoiceSession(props) {
  const { unitId } = useParams();
  return <Session key={unitId} unitId={unitId} {...props} />;
}

function Session({ progress, updateProgress, unitId }) {
  const unit = findUnit(unitId);
  const today = dateKey();
  const [queue, setQueue] = useState(() => (unit ? choiceQuestions(unit.items) : []));
  const [picked, setPicked] = useState(null); // the option chosen, once answered
  const [missed, setMissed] = useState([]); // items wrong at the first attempt
  const [voiceNote, setVoiceNote] = useState("");

  const question = queue[0];
  const answered = picked !== null;
  const correct = answered && picked === question.answer;
  const auto = useAutoNext(answered, correct, next);

  // Keyboard: 1-4 pick an option, Enter goes on.
  useEffect(() => {
    function onKey(event) {
      if (!question || event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (!answered && number >= 1 && number <= question.options.length) choose(question.options[number - 1]);
      else if (answered && event.key === "Enter" && event.target.tagName !== "BUTTON") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!unit || !isLevelOpen(unit.level, progress.vocab.passedLevels)) return <Navigate to="/vocab" replace />;

  function choose(option) {
    if (answered) return;
    setPicked(option);
    const item = question.item;
    const firstTry = !missed.some((m) => m.id === item.id);
    // Multiple choice is easier than recall, so a right answer leaves the schedule alone;
    // a wrong one at the first attempt brings the item back sooner.
    const wrongFirstTime = option !== question.answer && firstTry;
    updateProgress((previous) => ({
      ...previous,
      cards: wrongFirstTime ? { ...previous.cards, [item.id]: rate(previous.cards[item.id], "again", today) } : previous.cards,
      days: previous.days.includes(today) ? previous.days : [...previous.days, today],
    }));
    if (wrongFirstTime) setMissed((m) => [...m, item]);
  }

  function next() {
    // A wrong answer goes to the back of the queue: the session ends once each one is answered correctly.
    const nextQueue = correct ? queue.slice(1) : [...queue.slice(1), { ...question, options: shuffle(question.options) }];
    setQueue(nextQueue);
    setPicked(null);
    if (nextQueue.length === 0) updateProgress((previous) => withBestScore(previous, "choice", unit, unit.items.length - missed.length));
  }

  async function say(text) {
    auto.pause();
    const outcome = await speak(text);
    setVoiceNote(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  if (!question) {
    return (
      <SessionResult
        unit={unit}
        missed={missed}
        againText="Do them again"
        onAgain={() => { setQueue(choiceQuestions(unit.items)); setMissed([]); }}
      />
    );
  }

  const { item, kind } = question;

  return (
    <section className="page">
      <div className="session-bar">
        <Link to={`/vocab/level/${unit.level}`} className="btn btn-quiet">End session</Link>
        <span className="muted">{queue.length} left</span>
      </div>
      <SessionProgress left={queue.length} />

      <div className="flashcard">
        <span className="chip">{unit.title}</span>
        <QuestionPrompt question={question} filled={answered ? question.answer : ""} state={answered ? (correct ? "is-correct" : "is-wrong") : ""} />
        <Choices question={question} picked={picked} reveal={answered} onPick={choose} />

        {answered && (
          <div className={`feedback ${correct ? "is-correct" : "is-wrong"}`} role="status">
            <p className="feedback-title"><ResultMark ok={correct} />{correct ? "Correct" : "Not quite"}</p>
            <div className="example">
              <button className="btn btn-icon btn-small" onClick={() => say(displayPt(item))} aria-label={`Listen to ${displayPt(item)}`}>
                <Icon name="speaker" size={16} />
              </button>
              <div>
                <p lang="pt-PT"><strong>{displayPt(item)}</strong>: {item.en}</p>
                {kind !== "blank" && <p className="muted" lang="pt-PT">{item.example.pt}</p>}
              </div>
            </div>
            {item.note && <p className="note"><RichText text={item.note} /></p>}
            <div className="actions">
              <button className="btn btn-primary" onClick={next} autoFocus>Next</button>
            </div>
            <AutoNextControl auto={auto} />
          </div>
        )}
      </div>

      <div className="session-foot">
        {voiceNote && <p className="note" role="status">{voiceNote}</p>}
        <p className="note">Keys 1 to 4 pick an answer. It then moves on by itself; Pause stops it. Wrong answers come back at the end.</p>
      </div>
    </section>
  );
}
