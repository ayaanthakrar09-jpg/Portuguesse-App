import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AutoNextControl, useAutoNext } from "../../components/AutoNext";
import { markText } from "../../lib/answers";
import { orderedText } from "../../lib/exercises";
import { findTopic, orderTiles, practiceQuestions } from "../../lib/grammar";
import { dateKey } from "../../lib/storage";
import { AnswerField, Choices, ResultMark, WordTiles } from "../vocab/Questions";
import SessionProgress from "../../components/SessionProgress";
import RichText from "../../components/RichText";

const instructions = {
  form: "Type the right form",
  sentence: "Type the missing verb",
  choice: "Pick the right verb",
  rewrite: "Change it to the past",
  order: "Put the words in order",
};

// Topics about words rather than verbs ("focus": "word").
const wordInstructions = { ...instructions, sentence: "Type the missing word", choice: "Pick the right word" };

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
  const [chosen, setChosen] = useState([]); // word tiles picked so far, for "order" questions
  const [written, setWritten] = useState(""); // the accepted sentence that the tiles matched
  const [result, setResult] = useState(null); // null while answering, then "correct" | "accent" | "wrong"
  const [missed, setMissed] = useState([]); // questions wrong at the first attempt
  const input = useRef(null);

  const question = queue[0];
  const auto = useAutoNext(Boolean(result), result === "correct", next);

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
    const accepted = [question.answer, ...(question.alternatives ?? [])];
    if (question.type === "order") {
      if (chosen.length < question.tiles.length) return;
      // Tiles have no hyphens, so compare without them: "vejo te" counts as vejo-te. The answer shows the spelling.
      const loose = (text) => text.replace(/-/g, " ");
      const built = loose(orderedText(question, chosen));
      setWritten(accepted.find((sentence) => markText(built, [loose(sentence)]) !== "wrong") ?? "");
      return mark(markText(built, accepted.map(loose)));
    }
    if (!typed.trim()) return;
    mark(markText(typed, accepted));
  }

  function next() {
    // A wrong answer goes to the back of the queue: practice ends once each one has been answered correctly.
    const again = question.type === "order" ? { ...question, tiles: orderTiles(question.answer) } : question;
    const nextQueue = result === "wrong" ? [...queue.slice(1), again] : queue.slice(1);
    setQueue(nextQueue);
    setTyped("");
    setChosen([]);
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
  const isOrder = question.type === "order";
  const gapState = result ? (result === "wrong" ? "is-wrong" : "is-correct") : "";

  return (
    <section className="page">
      <div className="session-bar">
        <Link to={`/grammar/${topic.id}`} className="btn btn-quiet">End practice</Link>
        <span className="muted">{queue.length} left</span>
      </div>
      <SessionProgress left={queue.length} />

      <form className="flashcard" onSubmit={submit}>
        <span className="chip" lang="pt-PT">{topic.title}</span>
        <p className="muted">{(topic.focus === "word" ? wordInstructions : instructions)[question.type]}</p>

        {isOrder ? (
          <h1 className="flash-english">{question.en}</h1>
        ) : (
          <div className="gap-sentence">
            {question.from && <p className="rewrite-from" lang="pt-PT">{question.from}</p>}
            <p className="gap-pt" lang="pt-PT">
              {question.type === "form" ? `${question.person} ` : question.before}
              <span className={`gap ${gapState}`}>{result ? question.answer : picked || " "}</span>
              {question.type === "form" ? "" : question.after}
            </p>
            <p className="muted">
              {question.en ? `${question.en} ` : ""}
              {question.hint && !isChoice ? <span lang="pt-PT">({question.hint})</span> : ""}
            </p>
          </div>
        )}

        {isChoice ? (
          <Choices question={{ ...question, kind: "choice" }} picked={picked} reveal={Boolean(result)} onPick={choose} />
        ) : isOrder ? (
          <>
            <WordTiles question={question} chosen={chosen} onChange={setChosen} result={result} />
            <button type="submit" className="btn btn-primary" disabled={!result && chosen.length < question.tiles.length}>
              {result ? "Next" : "Check"}
            </button>
          </>
        ) : (
          <AnswerField inputRef={input} value={typed} onChange={setTyped} result={result} buttonText={result ? "Next" : "Check"} />
        )}

        {result && (
          <div className={`feedback is-${result}`} role="status">
            <p className="feedback-title">
              <ResultMark ok={result !== "wrong"} />
              {result === "correct" ? "Correct" : result === "accent" ? "Correct, but check the accents" : "Not quite"}
            </p>
            {(result !== "correct" || isOrder) && (
              <p>
                {result === "wrong" ? "The answer is " : isOrder ? "Written: " : "It's spelt "}
                <strong lang="pt-PT">{(isOrder && written) || question.answer}</strong>
              </p>
            )}
            {question.why && <p className="muted"><RichText text={question.why} /></p>}
            <AutoNextControl auto={auto} />
            {isChoice && (
              <div className="actions">
                <button type="button" className="btn btn-primary" onClick={next} autoFocus>Next</button>
              </div>
            )}
          </div>
        )}
      </form>

      <p className="note">
        {isChoice ? "Keys 1 and 2 pick an answer." : isOrder ? "Tap the words in order, then Check." : "Press Enter to check."} It then moves on by itself; Pause stops it. Wrong answers come back at the end.
      </p>
    </section>
  );
}

// The question as a complete sentence, for the result list.
function filled(question) {
  if (question.type === "form") return `${question.person} ${question.answer}`;
  if (question.type === "order") return question.answer;
  return `${question.before}${question.answer}${question.after}`;
}
