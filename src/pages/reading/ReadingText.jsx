import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { shuffle } from "../../lib/exercises";
import { findText, meaning, tokenize } from "../../lib/reading";
import { speak, speechMessages } from "../../lib/speech";
import { dateKey } from "../../lib/storage";
import { isLevelOpen } from "../../lib/vocab";
import { ResultMark } from "../vocab/Questions";
import { withPractice } from "../../lib/mastery";

// The key starts fresh when you move from one text straight to another.
export default function ReadingText(props) {
  const { textId } = useParams();
  return <Reader key={textId} textId={textId} {...props} />;
}

// Questions with their options in random order; `answer` becomes the right option's text.
function prepareQuestions(text) {
  return text.questions.map((question) => ({ ...question, answer: question.options[question.answer], options: shuffle(question.options) }));
}

function Reader({ progress, updateProgress, textId }) {
  const text = findText(textId);
  const [selected, setSelected] = useState(null); // { key, word } of the tapped word
  const [questions, setQuestions] = useState(() => (text ? prepareQuestions(text) : []));
  const [picked, setPicked] = useState({}); // question index -> option
  const [checked, setChecked] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");

  if (!text || !isLevelOpen(text.level, progress.vocab.passedLevels)) return <Navigate to="/reading" replace />;

  async function say(words) {
    const outcome = await speak(words);
    setVoiceNote(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  function check() {
    setChecked(true);
    const score = questions.filter((question, i) => picked[i] === question.answer).length;
    const today = dateKey();
    updateProgress((previous) => {
      const reading = previous.reading ?? {};
      return {
        ...previous,
        reading: { ...reading, [text.id]: withPractice(reading[text.id], score, questions.length, today) },
        days: previous.days.includes(today) ? previous.days : [...previous.days, today],
      };
    });
  }

  function tryAgain() {
    setQuestions(prepareQuestions(text));
    setPicked({});
    setChecked(false);
  }

  const allAnswered = questions.every((_, i) => picked[i]);
  const score = questions.filter((question, i) => picked[i] === question.answer).length;

  return (
    <section className="page">
      <Link to="/reading" className="btn btn-quiet back-link">Back to Reading</Link>
      <header className="page-head">
        <h1 className="page-title" lang="pt-PT">{text.title}</h1>
        <p className="muted">{text.titleEn}. Tap a word to see what it means.</p>
      </header>

      <article className="reading-card">
        <div className="actions">
          <button className="btn" onClick={() => say(text.paragraphs.join(" ").replace(/[—«»]/g, ""))}>
            <Icon name="speaker" /> Listen to the text
          </button>
        </div>

        <div className="reading-text" lang="pt-PT">
          {text.paragraphs.map((paragraph, p) => (
            <p key={p}>
              {tokenize(paragraph).map((token, t) => {
                if (!token.isWord) return token.text;
                const key = `${p}-${t}`;
                return (
                  <button
                    key={key}
                    className={`word ${selected?.key === key ? "is-selected" : ""}`}
                    onClick={() => setSelected({ key, word: token.text })}
                  >
                    {token.text}
                  </button>
                );
              })}
            </p>
          ))}
        </div>

        <div className="word-panel" role="status">
          {selected ? (
            <>
              <button className="btn btn-icon btn-small" onClick={() => say(selected.word)} aria-label={`Listen to ${selected.word}`}>
                <Icon name="speaker" size={16} />
              </button>
              <p>
                <strong lang="pt-PT">{selected.word}</strong> <span className="muted">{meaning(text, selected.word)}</span>
              </p>
            </>
          ) : (
            <p className="muted">Tap any word in the text to see its meaning here.</p>
          )}
        </div>
        {voiceNote && <p className="note">{voiceNote}</p>}
      </article>

      <div className="card">
        <h2 className="card-title">Questions</h2>
        <ol className="reading-questions">
          {questions.map((question, i) => (
            <li key={question.q}>
              <p className="question-title">
                {checked && <ResultMark ok={picked[i] === question.answer} />}
                {question.q}
              </p>
              <div className="choices" role="group" aria-label={question.q}>
                {question.options.map((option) => {
                  let state = picked[i] === option ? "is-picked" : "";
                  if (checked) state = option === question.answer ? "is-correct" : picked[i] === option ? "is-wrong" : "is-dim";
                  return (
                    <button
                      key={option}
                      className={`choice ${state}`}
                      onClick={() => setPicked((p) => ({ ...p, [i]: option }))}
                      disabled={checked}
                      aria-pressed={picked[i] === option}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>

        {checked ? (
          <>
            <p className="feedback-title">{score} of {questions.length} right</p>
            <div className="actions">
              <Link to="/reading" className="btn btn-primary">Back to Reading</Link>
              <button className="btn" onClick={tryAgain}>Answer again</button>
            </div>
          </>
        ) : (
          <div className="actions">
            <button className="btn btn-primary" onClick={check} disabled={!allAnswered}>Check answers</button>
          </div>
        )}
      </div>

      <p className="note">Not yet checked by a native speaker.</p>
    </section>
  );
}
