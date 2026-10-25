import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { shuffle } from "../../lib/exercises";
import { compareSpeech, recognitionMessages, recognitionSupported, startListening } from "../../lib/recognition";
import { speak, speechMessages } from "../../lib/speech";
import { dateKey } from "../../lib/storage";
import { findUnit, isLevelOpen } from "../../lib/vocab";

// The key starts a fresh session when you move from one unit straight to another.
export default function SpeakingSession(props) {
  const { unitId } = useParams();
  return <Session key={unitId} unitId={unitId} {...props} />;
}

function Session({ progress, updateProgress, unitId }) {
  const unit = findUnit(unitId);
  const canListen = recognitionSupported();
  const [sentences] = useState(() => (unit ? shuffle(unit.items).map((item) => ({ id: item.id, ...item.example })) : []));
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState(""); // live and final transcript
  const [result, setResult] = useState(null); // { words, heardCount } once the browser has finished
  const [problem, setProblem] = useState("");
  const [practised, setPractised] = useState([]); // sentence ids practised this session
  const stop = useRef(null);

  // Stop the microphone if you leave the page while it's listening.
  useEffect(() => () => stop.current?.(), []);

  if (!unit || !isLevelOpen(unit.level, progress.vocab.passedLevels)) return <Navigate to="/speaking" replace />;

  const sentence = sentences[index];

  // Counts a sentence once per session towards "phrases practised" and today's streak.
  function markPractised() {
    if (practised.includes(sentence.id)) return;
    setPractised((list) => [...list, sentence.id]);
    const today = dateKey();
    updateProgress((previous) => ({
      ...previous,
      practisedPhrases: previous.practisedPhrases + 1,
      days: previous.days.includes(today) ? previous.days : [...previous.days, today],
    }));
  }

  async function listen(rate) {
    const outcome = await speak(sentence.pt, { rate });
    setProblem(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  function speakNow() {
    if (listening) {
      stop.current?.();
      return;
    }
    window.speechSynthesis?.cancel(); // don't let the app's own voice be recorded
    setHeard("");
    setResult(null);
    setProblem("");
    setListening(true);
    stop.current = startListening({
      onText: setHeard,
      onEnd: ({ text, error }) => {
        setListening(false);
        stop.current = null;
        if (error) return setProblem(recognitionMessages[error] ?? `Speech recognition stopped (${error}). Try again.`);
        if (!text.trim()) return setProblem(recognitionMessages["no-speech"]);
        setHeard(text);
        setResult(compareSpeech(sentence.pt, text));
        markPractised();
      },
    });
  }

  function next() {
    stop.current?.();
    setIndex((i) => i + 1);
    setHeard("");
    setResult(null);
    setProblem("");
  }

  /* ---------- Finished ---------- */
  if (!sentence) {
    return (
      <section className="page">
        <h1 className="page-title">Unit finished</h1>
        <div className="card">
          <p>You practised {practised.length} of {sentences.length} sentences from {unit.title}.</p>
          <div className="actions">
            <Link to="/speaking" className="btn btn-primary">Back to Speaking</Link>
            <Link to={`/vocab/level/${unit.level}`} className="btn">Go to Vocab</Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- Sentence ---------- */
  return (
    <section className="page">
      <div className="session-bar">
        <Link to="/speaking" className="btn btn-quiet">End session</Link>
        <span className="muted">{index + 1} of {sentences.length}</span>
      </div>

      <div className="flashcard">
        <span className="chip">{unit.title}</span>
        <p className="speak-sentence" lang="pt-PT">
          {result
            ? result.words.map((word, i) => (
                <span key={i} className={word.heard ? "word-heard" : "word-missed"}>{word.text} </span>
              ))
            : sentence.pt}
        </p>
        <p className="muted">{sentence.en}</p>

        <div className="actions">
          <button className="btn" onClick={() => listen(0.9)}><Icon name="speaker" /> Listen</button>
          <button className="btn" onClick={() => listen(0.6)}>Slower</button>
          {canListen ? (
            <button className={`btn ${result ? "" : "btn-primary"} ${listening ? "is-listening" : ""}`} onClick={speakNow}>
              <Icon name="speaking" /> {listening ? "Stop" : result ? "Try again" : "Speak"}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => { markPractised(); next(); }}>
              <Icon name="check" /> I said it
            </button>
          )}
        </div>

        {(listening || heard) && (
          <div className="heard" role="status">
            <p className="muted">{listening ? "Listening… say the sentence now." : "The browser heard:"}</p>
            {heard && <p lang="pt-PT">“{heard}”</p>}
          </div>
        )}

        {result && (
          <p className={result.heardCount === result.words.length ? "speak-score is-all" : "speak-score"}>
            {result.heardCount === result.words.length
              ? "Every word was recognised."
              : `${result.heardCount} of ${result.words.length} words recognised. The faded ones weren't picked up; listen again and repeat them.`}
          </p>
        )}

        {problem && <p className="note" role="status">{problem}</p>}
      </div>

      <div className="session-foot">
        <button className={`btn ${result ? "btn-primary" : "btn-quiet"}`} onClick={next}>
          {index + 1 === sentences.length ? "Finish" : result ? "Next sentence" : "Skip"}
        </button>
        <p className="note">
          This shows what the browser understood, not a pronunciation score. Not yet checked by a native speaker.
        </p>
      </div>
    </section>
  );
}
