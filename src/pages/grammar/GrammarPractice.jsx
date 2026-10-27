import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { markText } from "../../lib/answers";
import { findTopic, practiceQuestions } from "../../lib/grammar";
import { dateKey } from "../../lib/storage";
import { AnswerField, Choices, ResultMark } from "../vocab/Questions";

const instructions = {
  form: "Type the right form",
  sentence: "Type the missing verb",
  choice: "Pick the right verb",
};

// The key starts fresh when you move from one topic straight to another.
export default function GrammarPractice(props) {
  const { topicId } = useParams();
  return <Practice key={topicId} topicId={topicId} {...props} />;
}

function Practice({ updateProgress, topicId }) {
  const topic = findTopic(topicId);
  const [queue, setQueue] = useState(() => (topic ? practiceQuestions(topic) : []));
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null); // null while answering, then "correct" | "accent" | "wrong"
  const [missed, setMissed] = useState([]); // questions wrong at the first attempt
  const input = useRef(null);

  const question = queue[0];

  // Keyboard for "pick" questions: 1 or 2 to choose, Enter for the next question.
  useEffect(() => {
    function onKey(event) {
      if (question?.type !== "choice" || event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (!result && number >= 1 && number <= question.options.length) choose(question.options[number - 1]);
      else if (result && event.key === "Enter" && event.target.tagName !== "BUTTON") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!topic) return <Navigate to="/grammar" replace />;

  function mark(outcome) {
    setResult(outcome);
    if (outcome === "wrong" && !missed.some((m) => m.key === question.key)) setMissed((m) => [...m, question]);
  }

  function choose(option) {
    if (result) return;
    setPicked(option);
    mark(option === question.answer ? "correct" : "wrong");
  }

  function submit(event) {
    event.preventDefault();
    if (result) return next();
    if (!typed.trim()) return;
    mark(markText(typed, [question.answer, ...(question.alternatives ?? [])]));
  }

  function next() {
    // A wrong answer goes to the back of the queue: practice ends once each one has been answered correctly.
    const nextQueue = result === "wrong" ? [...queue.slice(1), question] : queue.slice(1);
    setQueue(nextQueue);
    setTyped("");
    setPicked(null);
    setResult(null);
    if (nextQueue.length === 0) saveScore();
    else input.current?.focus();
  }

  function saveScore() {
    const total = topic.drills.length;
    const score = total - missed.length;
    const today = dateKey();
    updateProgress((previous) => {
      const grammar = previous.grammar ?? {};
      const best = Math.max(score, grammar[topic.id]?.best ?? 0);
      return {
        ...previous,
        grammar: { ...grammar, [topic.id]: { best, total } },
        days: previous.days.includes(today) ? previous.days : [...previous.days, today],
      };
    });
  }

  /* ---------- Finished ---------- */
  if (!question) {
    const total = topic.drills.length;
    return (
      <section className="page">
        <h1 className="page-title">{total - missed.length} of {total} right first time</h1>
        <div className="card">
          {missed.length === 0 ? (
            <p>Every answer was right at the first attempt.</p>
          ) : (
            <>
              <p>Worth another look:</p>
              <ul className="missed">
                {missed.map((m) => (
                  <li key={m.key}>
                    <span lang="pt-PT">{filled(m)}</span>
                    {m.en && <span className="muted">{m.en}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="actions">
            <Link to="/grammar" className="btn btn-primary">Back to Grammar</Link>
            <button className="btn" onClick={() => { setQueue(practiceQuestions(topic)); setMissed([]); }}>Practise again</button>
            <Link to={`/grammar/${topic.id}`} className="btn btn-quiet">Read the explanation</Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- Question ---------- */
  const isChoice = question.type === "choice";
  const gapState = result ? (result === "wrong" ? "is-wrong" : "is-correct") : "";

  return (
    <section className="page">
      <div className="session-bar">
        <Link to={`/grammar/${topic.id}`} className="btn btn-quiet">End practice</Link>
        <span className="muted">{queue.length} left</span>
      </div>

      <form className="flashcard" onSubmit={submit}>
        <span className="chip" lang="pt-PT">{topic.title}</span>
        <p className="muted">{instructions[question.type]}</p>

        <div className="gap-sentence">
          <p className="gap-pt" lang="pt-PT">
            {question.type === "form" ? `${question.person} ` : question.before}
            <span className={`gap ${gapState}`}>{result ? question.answer : picked || " "}</span>
            {question.type === "form" ? "" : question.after}
          </p>
          <p className="muted">
            {question.en ? `${question.en} ` : ""}
            {isChoice ? "" : <span lang="pt-PT">({question.verb})</span>}
          </p>
        </div>

        {isChoice ? (
          <Choices question={{ ...question, kind: "choice" }} picked={picked} reveal={Boolean(result)} onPick={choose} />
        ) : (
          <AnswerField inputRef={input} value={typed} onChange={setTyped} result={result} buttonText={result ? "Next" : "Check"} />
        )}

        {result && (
          <div className={`feedback is-${result}`} role="status">
            <p className="feedback-title">
              <ResultMark ok={result !== "wrong"} />
              {result === "correct" ? "Correct" : result === "accent" ? "Correct, but check the accents" : "Not quite"}
            </p>
            {result !== "correct" && (
              <p>
                {result === "wrong" ? "The answer is " : "It's spelt "}
                <strong lang="pt-PT">{question.answer}</strong>
              </p>
            )}
            {question.why && <p className="muted">{question.why}</p>}
            {isChoice && (
              <div className="actions">
                <button type="button" className="btn btn-primary" onClick={next} autoFocus>Next</button>
              </div>
            )}
          </div>
        )}
      </form>

      <p className="note">
        {isChoice ? "Keys 1 and 2 pick an answer, Enter goes on." : "Press Enter to check, then Enter again for the next one."} Wrong answers come back at the end.
      </p>
    </section>
  );
}

// The question as a complete sentence, for the result list.
function filled(question) {
  if (question.type === "form") return `${question.person} ${question.answer}`;
  return `${question.before}${question.answer}${question.after}`;
}
