import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AutoNextControl, useAutoNext } from "../../components/AutoNext";
import Icon from "../../components/Icon";
import RichText from "../../components/RichText";
import SessionProgress from "../../components/SessionProgress";
import {
  DAILY_GOAL_XP, LESSONS_PER_UNIT, XP_PER_LESSON, XP_PERFECT_BONUS,
  buildLesson, isRight, lessonQuestion, lessonsDone, withLessonResult, xpOn,
} from "../../lib/lessons";
import { playSound } from "../../lib/sound";
import { speak, speechMessages, voiceStatus } from "../../lib/speech";
import { dateKey } from "../../lib/storage";
import { displayPt, findUnit, isLevelOpen } from "../../lib/vocab";
import { AnswerField, Choices, QuestionPrompt, ResultMark, WordTiles, typeHint } from "../vocab/Questions";
import GoalRing from "./GoalRing";

// A short mixed lesson for one unit. Wrong answers come back at the end; there are no hearts.
export default function Lesson(props) {
  const { unitId } = useParams();
  const [round, setRound] = useState(0);
  const [canListen, setCanListen] = useState(null);
  useEffect(() => { voiceStatus().then((status) => setCanListen(status === "ok")); }, []);
  if (canListen === null) return <section className="page" aria-busy="true" />;
  return <LessonRun key={`${unitId}-${round}`} unitId={unitId} canListen={canListen} onAgain={() => setRound((r) => r + 1)} {...props} />;
}

const instructions = {
  "build-pt": "Write this in Portuguese",
  "type-sentence": "Type this in Portuguese",
  "build-en": "What does this mean?",
  listen: "Tap what you hear",
};

function LessonRun({ progress, updateProgress, unitId, canListen, onAgain }) {
  const unit = findUnit(unitId);
  const navigate = useNavigate();
  const today = dateKey();
  const [lesson] = useState(() => (unit ? buildLesson(unit, progress.cards, today, { canListen, lessonNumber: lessonsDone(progress, unit.id) + 1 }) : null));
  const [queue, setQueue] = useState(() => lesson?.screens.map((screen, sid) => ({ ...screen, sid })) ?? []);
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState("");
  const [chosen, setChosen] = useState([]);
  const [result, setResult] = useState(null); // null, then "correct" or "wrong"
  const [wrongScreens, setWrongScreens] = useState(() => new Set()); // screens got wrong at least once
  const [combo, setCombo] = useState(0);
  const [finished, setFinished] = useState(null);
  const [voiceNote, setVoiceNote] = useState("");
  const inputRef = useRef(null);
  const screen = queue[0];
  const auto = useAutoNext(Boolean(result), result === "correct", next);

  // Listening questions play by themselves when they appear.
  useEffect(() => {
    if (screen?.kind === "listen" && !result) say(screen.answer);
  }, [screen?.sid, screen?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!unit || !isLevelOpen(unit.level, progress.vocab.passedLevels)) return <Navigate to="/learn" replace />;
  if (finished) return <LessonEnd unit={unit} finished={finished} onAgain={onAgain} />;

  const questionCount = lesson.screens.filter((s) => s.kind !== "new").length;

  async function say(text, rate) {
    auto.pause();
    const outcome = await speak(text, rate ? { rate } : undefined);
    setVoiceNote(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  function currentAnswer() {
    if (screen.kind === "type" || screen.kind === "type-sentence") return typed;
    if (["build-pt", "build-en", "listen"].includes(screen.kind)) return chosen.map((id) => screen.tiles.find((t) => t.id === id).text).join(" ");
    return picked;
  }

  function ready() {
    if (screen.kind === "new") return true;
    if (screen.kind === "type" || screen.kind === "type-sentence") return typed.trim() !== "";
    if (screen.tiles) return chosen.length > 0;
    return picked !== null;
  }

  function check(event) {
    event?.preventDefault();
    if (screen.kind === "new" || result) return next();
    if (!ready()) return;
    const right = isRight(screen, currentAnswer());
    setResult(right ? "correct" : "wrong");
    playSound(right ? "right" : "wrong");
    setCombo((c) => (right ? c + 1 : 0));
    if (!right) setWrongScreens((set) => new Set(set).add(screen.sid));
  }

  function next() {
    const rest = queue.slice(1);
    // A wrong answer comes back at the end, asked afresh (new tiles, new options).
    const nextQueue = result === "wrong" ? [...rest, { ...lessonQuestion(screen.kind, screen.item, unit.items), sid: screen.sid }] : rest;
    setQueue(nextQueue);
    setPicked(null);
    setTyped("");
    setChosen([]);
    setResult(null);
    if (nextQueue.length === 0) finish();
  }

  function finish() {
    const perfect = wrongScreens.size === 0;
    const xp = XP_PER_LESSON + (perfect ? XP_PERFECT_BONUS : 0);
    const missedIds = new Set(lesson.screens.filter((s) => wrongScreens.has(s.sid)).map((s) => s.item.id));
    const xpBefore = xpOn(progress, today);
    updateProgress((previous) => withLessonResult(previous, unit, lesson.focus, missedIds, xp, today));
    playSound("done");
    setFinished({
      xp,
      perfect,
      xpToday: xpBefore + xp,
      accuracy: Math.round(((questionCount - wrongScreens.size) / questionCount) * 100),
      lessonNumber: lessonsDone(progress, unit.id) + 1,
    });
  }

  const item = screen.item;
  return (
    <section className="page lesson">
      <div className="lesson-top">
        <button type="button" className="btn btn-icon btn-quiet" onClick={() => navigate("/learn")} aria-label="Leave lesson">
          <Icon name="cross" size={20} />
        </button>
        <SessionProgress left={queue.length} />
        <span className={`combo ${combo >= 3 ? "is-on" : ""}`} aria-live="polite">{combo >= 3 ? `${combo} in a row` : ""}</span>
      </div>
      <div className="lesson-label">
        <span className="chip">{unit.title}{lesson.review ? ": unit review" : ""}</span>
      </div>

      <form className="lesson-body" onSubmit={check}>
        <div className="lesson-question" key={`${screen.sid}-${queue.length}`}>
          {screen.kind === "new" && (
            <div className="new-word">
              <p className="muted">New word</p>
              <p className="new-word-pt" lang="pt-PT">{displayPt(item)}</p>
              <p className="new-word-en">{item.en}</p>
              <div className="example">
                <button type="button" className="btn btn-icon btn-small" onClick={() => say(item.example.pt)} aria-label="Listen to the example">
                  <Icon name="speaker" size={16} />
                </button>
                <div>
                  <p lang="pt-PT">{item.example.pt}</p>
                  <p className="muted">{item.example.en}</p>
                </div>
              </div>
              {item.note && <p className="note"><RichText text={item.note} /></p>}
            </div>
          )}

          {["pt-en", "en-pt", "blank"].includes(screen.kind) && (
            <>
              <QuestionPrompt question={screen} filled={result ? screen.answer : picked} state={result ? `is-${result}` : ""} />
              <Choices question={screen} picked={picked} reveal={Boolean(result)} onPick={setPicked} />
            </>
          )}

          {screen.kind === "type" && (
            <>
              <QuestionPrompt question={screen} />
              <p className="muted">{typeHint(item)}</p>
              <AnswerField inputRef={inputRef} value={typed} onChange={setTyped} result={result} buttonText={result ? "Continue" : "Check"} />
            </>
          )}

          {screen.kind === "type-sentence" && (
            <>
              <p className="muted">{instructions[screen.kind]}</p>
              <p className="sentence-text">{screen.prompt}</p>
              <AnswerField inputRef={inputRef} value={typed} onChange={setTyped} result={result} buttonText={result ? "Continue" : "Check"} />
            </>
          )}

          {screen.tiles && (
            <>
              <p className="muted">{instructions[screen.kind]}</p>
              {screen.kind === "listen" ? (
                <div className="listen-buttons">
                  <button type="button" className="btn listen-big" onClick={() => say(screen.answer)} aria-label="Play the sentence again">
                    <Icon name="speaker" size={28} />
                  </button>
                  <button type="button" className="btn btn-quiet" onClick={() => say(screen.answer, 0.6)}>Slower</button>
                </div>
              ) : (
                <div className="sentence-prompt">
                  {screen.kind === "build-en" && (
                    <button type="button" className="btn btn-icon btn-small" onClick={() => say(screen.prompt)} aria-label="Listen">
                      <Icon name="speaker" size={16} />
                    </button>
                  )}
                  <p className="sentence-text" lang={screen.kind === "build-en" ? "pt-PT" : undefined}>{screen.prompt}</p>
                </div>
              )}
              <WordTiles question={screen} chosen={chosen} onChange={setChosen} result={result} lang={screen.kind === "build-en" ? "en" : "pt-PT"} />
            </>
          )}
        </div>

        <div className={`check-bar ${result ? `is-${result}` : ""}`}>
          <div className="check-bar-inner">
            {result && (
              <div className="check-feedback" role="status">
                <p className="feedback-title">
                  <ResultMark ok={result === "correct"} />
                  {result === "correct" ? "Right!" : "Correct answer:"}
                </p>
                {(result === "wrong" || screen.tiles || screen.kind === "type-sentence") && (
                  <p className="check-answer" lang={screen.kind === "build-en" || screen.kind === "pt-en" ? "en" : "pt-PT"}>{screen.answer}</p>
                )}
                {(screen.tiles || screen.kind === "type-sentence") && screen.kind !== "build-en" && <p className="muted">{item.example.en}</p>}
                {screen.kind === "build-en" && <p className="muted" lang="pt-PT">{item.example.pt}</p>}
                <AutoNextControl auto={auto} />
              </div>
            )}
            {screen.kind !== "type" && screen.kind !== "type-sentence" && (
              <button type="submit" className="btn btn-primary check-button" disabled={!result && !ready()}>
                {screen.kind === "new" || result ? "Continue" : "Check"}
              </button>
            )}
          </div>
          {voiceNote && <p className="note">{voiceNote}</p>}
        </div>
      </form>
    </section>
  );
}

function LessonEnd({ unit, finished, onAgain }) {
  const unitDone = finished.lessonNumber >= LESSONS_PER_UNIT;
  const nextLessonLink = !unitDone;
  return (
    <section className="page lesson-end">
      {finished.perfect && <Confetti />}
      <p className="lesson-end-title" lang="pt-PT">{finished.perfect ? "Perfeito!" : "Muito bem!"}</p>
      <p className="muted">
        {unitDone
          ? `${unit.title}: unit finished. Its tile on the path is now an azulejo.`
          : `${unit.title}: lesson ${finished.lessonNumber} of ${LESSONS_PER_UNIT} done.`}
      </p>

      <div className="end-stats">
        <div className="end-stat">
          <span className="end-value">+{finished.xp}</span>
          <span className="muted">XP{finished.perfect ? `, with ${XP_PERFECT_BONUS} for no mistakes` : ""}</span>
        </div>
        <div className="end-stat">
          <span className="end-value">{finished.accuracy}%</span>
          <span className="muted">right first time</span>
        </div>
        <div className="end-stat end-goal">
          <GoalRing value={finished.xpToday} goal={DAILY_GOAL_XP} size={64} />
          <span className="muted">
            {finished.xpToday >= DAILY_GOAL_XP ? "Daily goal reached" : `${finished.xpToday} of ${DAILY_GOAL_XP} XP today`}
          </span>
        </div>
      </div>

      <div className="actions">
        {nextLessonLink
          ? <button type="button" className="btn btn-primary" onClick={onAgain}>Next lesson</button>
          : <Link to="/learn" className="btn btn-primary">Back to the path</Link>}
        {nextLessonLink && <Link to="/learn" className="btn">Back to the path</Link>}
      </div>
    </section>
  );
}

// Small azulejo tiles falling once, after a lesson with no mistakes.
function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <span key={i} style={{ "--x": `${(i * 37) % 100}%`, "--delay": `${(i % 6) * 90}ms`, "--spin": `${(i % 2 ? 1 : -1) * (90 + i * 20)}deg` }} />
      ))}
    </div>
  );
}
