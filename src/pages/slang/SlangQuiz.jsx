import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import slang from "../../data/slang/pt-pt.json";
import { options, shuffle } from "../../lib/exercises";
import { dateKey } from "../../lib/storage";
import { Choices, ResultMark } from "../vocab/Questions";
import { AutoNextControl, useAutoNext } from "../../components/AutoNext";

export const QUIZ_LENGTH = 10;

// Main words of a meaning ("cool, great" -> cool, great), to keep near-synonyms out of the wrong options.
function keyWords(meaning) {
  return meaning.toLowerCase().match(/[a-z]{4,}/g) ?? [];
}

// "What does X mean?" for random expressions. Swear words are left out of the quiz.
// Wrong options never share a main word with the right one, so only one answer can fit.
function newQuiz() {
  const pool = slang.items.filter((item) => item.group !== "rude");
  return shuffle(pool)
    .slice(0, QUIZ_LENGTH)
    .map((item) => {
      const words = keyWords(item.en);
      const others = pool.filter((other) => other.id !== item.id && !keyWords(other.en).some((w) => words.includes(w)));
      return { item, kind: "pt-en", prompt: item.pt, answer: item.en, options: options(item.en, others.map((other) => other.en)) };
    });
}

export default function SlangQuiz({ updateProgress }) {
  const [queue, setQueue] = useState(newQuiz);
  const [picked, setPicked] = useState(null);
  const [missed, setMissed] = useState([]);

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

  function choose(option) {
    if (answered) return;
    setPicked(option);
    if (option !== question.answer && !missed.some((m) => m.id === question.item.id)) setMissed((m) => [...m, question.item]);
  }

  function next() {
    // A wrong answer goes to the back of the queue, with its options shuffled.
    const nextQueue = correct ? queue.slice(1) : [...queue.slice(1), { ...question, options: shuffle(question.options) }];
    setQueue(nextQueue);
    setPicked(null);
    if (nextQueue.length === 0) {
      const score = QUIZ_LENGTH - missed.length;
      const today = dateKey();
      updateProgress((previous) => ({
        ...previous,
        slang: { best: Math.max(score, previous.slang?.best ?? 0), total: QUIZ_LENGTH },
        days: previous.days.includes(today) ? previous.days : [...previous.days, today],
      }));
    }
  }

  /* ---------- Finished ---------- */
  if (!question) {
    return (
      <section className="page">
        <h1 className="page-title">{QUIZ_LENGTH - missed.length} of {QUIZ_LENGTH} right first time</h1>
        <div className="card">
          {missed.length === 0 ? (
            <p>Every answer was right at the first attempt.</p>
          ) : (
            <>
              <p>Worth another look:</p>
              <ul className="missed">
                {missed.map((item) => (
                  <li key={item.id}>
                    <span lang="pt-PT">{item.pt}</span>
                    <span className="muted">{item.en}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="actions">
            <Link to="/slang" className="btn btn-primary">Back to Slang</Link>
            <button className="btn" onClick={() => { setQueue(newQuiz()); setMissed([]); }}>New quiz</button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- Question ---------- */
  const { item } = question;
  return (
    <section className="page">
      <div className="session-bar">
        <Link to="/slang" className="btn btn-quiet">End quiz</Link>
        <span className="muted">{queue.length} left</span>
      </div>

      <div className="flashcard">
        <span className="chip">Slang quiz</span>
        <p className="muted">What does this mean?</p>
        <h1 className="flash-word" lang="pt-PT">{item.pt}</h1>
        <Choices question={question} picked={picked} reveal={answered} onPick={choose} />

        {answered && (
          <div className={`feedback ${correct ? "is-correct" : "is-wrong"}`} role="status">
            <p className="feedback-title"><ResultMark ok={correct} />{correct ? "Correct" : "Not quite"}</p>
            <p><span lang="pt-PT">{item.example.pt}</span> <span className="muted">{item.example.en}</span></p>
            <p className="muted">{item.formality}, {item.region}</p>
            <div className="actions">
              <button className="btn btn-primary" onClick={next} autoFocus>Next</button>
            </div>
            <AutoNextControl auto={auto} />
          </div>
        )}
      </div>

      <p className="note">Keys 1 to 4 pick an answer. It then moves on by itself; Pause stops it. Swear words are not in the quiz.</p>
    </section>
  );
}
