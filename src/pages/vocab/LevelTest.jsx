import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { markAnswer, markText } from "../../lib/answers";
import { testQuestions, withTestResult } from "../../lib/exercises";
import { dateKey } from "../../lib/storage";
import { rate } from "../../lib/srs";
import { findLevel, findUnit, isLevelOpen, levels, passMark } from "../../lib/vocab";
import { AnswerField, Choices, QuestionPrompt, typeHint } from "./Questions";

function newTest(level) {
  const itemsOf = (lvl) => lvl.units.flatMap((unit) => unit.items);
  const earlier = levels.filter((lvl) => lvl.id < level.id).flatMap(itemsOf);
  return testQuestions(itemsOf(level), earlier, (item) => findUnit(item.unit).items);
}

// The key starts a fresh test when you move from one level straight to another.
export default function LevelTest(props) {
  const { levelId } = useParams();
  return <Test key={levelId} levelId={levelId} {...props} />;
}

function Test({ progress, updateProgress, levelId }) {
  const level = findLevel(levelId);
  const [questions, setQuestions] = useState(() => (level ? newTest(level) : []));
  const [answers, setAnswers] = useState([]); // { question, given, outcome } per question answered
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState("");
  const input = useRef(null);

  const question = questions[answers.length];
  const isChoice = question && question.options;

  // Keyboard for multiple choice: 1-4 pick, Enter confirms.
  useEffect(() => {
    function onKey(event) {
      if (!isChoice || event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (number >= 1 && number <= question.options.length) setPicked(question.options[number - 1]);
      else if (event.key === "Enter" && picked && event.target.tagName !== "BUTTON") submit(event);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!level || !isLevelOpen(level.id, progress.vocab.passedLevels)) return <Navigate to="/vocab" replace />;

  function submit(event) {
    event.preventDefault();
    let given;
    let outcome;
    if (isChoice) {
      if (!picked) return;
      given = picked;
      outcome = picked === question.answer ? "correct" : "wrong";
    } else {
      if (!typed.trim()) return;
      given = typed.trim();
      outcome = question.kind === "type-gap" ? markText(typed, [question.answer]) : markAnswer(typed, question.item);
    }
    const all = [...answers, { question, given, outcome }];
    setAnswers(all);
    setPicked(null);
    setTyped("");
    if (all.length === questions.length) finish(all);
  }

  function finish(all) {
    const today = dateKey();
    const score = all.filter((a) => a.outcome !== "wrong").length;
    const passed = score / all.length >= passMark;
    const wrongItems = all.filter((a) => a.outcome === "wrong").map((a) => a.question.item);
    updateProgress((previous) => {
      // Items missed in the test come back sooner in reviews.
      const cards = { ...previous.cards };
      for (const item of wrongItems) cards[item.id] = rate(cards[item.id], "again", today);
      const days = previous.days.includes(today) ? previous.days : [...previous.days, today];
      return withTestResult({ ...previous, cards, days }, level.id, score, all.length, passed, today);
    });
  }

  function retake() {
    setQuestions(newTest(level));
    setAnswers([]);
  }

  /* ---------- Results ---------- */
  if (!question) {
    const score = answers.filter((a) => a.outcome !== "wrong").length;
    const percent = Math.round((score / answers.length) * 100);
    const passed = score / answers.length >= passMark;
    const wrong = answers.filter((a) => a.outcome === "wrong");
    const accents = answers.filter((a) => a.outcome === "accent");
    const nextLevel = findLevel(level.id + 1);
    return (
      <section className="page">
        <header className="page-head">
          <h1 className="page-title">{passed ? `Level ${level.id} passed` : "Not passed yet"}</h1>
          <p className="muted">
            {score} of {answers.length} right ({percent}%). The pass mark is {Math.round(passMark * 100)}%.
          </p>
        </header>

        <div className={`card test-result ${passed ? "is-passed" : ""}`}>
          <p>
            {passed
              ? nextLevel
                ? `Level ${nextLevel.id} is now open.`
                : `Level ${level.id + 1} opens here once its words are ready.`
              : "Practise the items below in their units, then try again. You can retake the test as often as you like."}
          </p>
          <div className="actions">
            {passed && nextLevel ? (
              <Link to={`/vocab/level/${nextLevel.id}`} className="btn btn-primary">Go to Level {nextLevel.id}</Link>
            ) : (
              <Link to={`/vocab/level/${level.id}`} className="btn btn-primary">Back to Level {level.id}</Link>
            )}
            <button className="btn" onClick={retake}>Retake the test</button>
          </div>
        </div>

        {wrong.length > 0 && (
          <div className="card">
            <h2 className="card-title">What you missed</h2>
            <ul className="review-list">
              {wrong.map(({ question: q, given }) => (
                <li key={q.item.id + q.kind}>
                  <p className="muted">{q.kind === "blank" || q.kind === "type-gap" ? `${q.before}___${q.after}` : q.prompt}</p>
                  <p>
                    You answered <s lang="pt-PT">{given}</s>. Answer: <strong lang="pt-PT">{q.answer}</strong>
                  </p>
                  <p className="muted">Practise it in: {findUnit(q.item.unit).title}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {accents.length > 0 && (
          <p className="note">
            Counted as right, but check the accents:{" "}
            {accents.map((a) => a.question.answer).join(", ")}
          </p>
        )}
      </section>
    );
  }

  /* ---------- Question ---------- */
  const number = answers.length + 1;
  return (
    <section className="page">
      <div className="session-bar">
        <Link to={`/vocab/level/${level.id}`} className="btn btn-quiet">Leave test</Link>
        <span className="muted">Question {number} of {questions.length}</span>
      </div>
      <div className="test-track" aria-hidden="true">
        <span style={{ width: `${(answers.length / questions.length) * 100}%` }} />
      </div>

      <form className="flashcard" onSubmit={submit} key={number}>
        <span className="chip">Level {level.id} test</span>
        <QuestionPrompt question={question} filled={question.kind === "blank" ? picked : ""} />
        {isChoice ? (
          <>
            <Choices question={question} picked={picked} onPick={setPicked} />
            <button type="submit" className="btn btn-primary" disabled={!picked}>
              {number === questions.length ? "Finish" : "Next"}
            </button>
          </>
        ) : (
          <>
            {question.kind === "type" && <p className="muted">{typeHint(question.item)}</p>}
            <AnswerField inputRef={input} value={typed} onChange={setTyped} buttonText={number === questions.length ? "Finish" : "Next"} />
          </>
        )}
      </form>

      <p className="note">Answers are marked at the end. Missing accents count as right.</p>
    </section>
  );
}
