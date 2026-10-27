import { useEffect, useRef, useState } from "react";
import Icon from "../../components/Icon";
import { ACCENTS } from "../vocab/Questions";
import { displayPt, openItems } from "../../lib/vocab";
import { topics } from "../../lib/grammar";
import { speak, speechMessages } from "../../lib/speech";
import { DAILY_LIMIT, TURN_LIMIT, forgetKey, getKey, getModel, keyHint, saveKey, tutorTurn, usedToday } from "../../lib/ai";

// `text` goes to the AI; `blurb` is what the learner sees.
const scenarios = [
  { id: "chat", label: "Free chat", blurb: "A friendly chat about your day, what you like and your plans.", text: "A friendly chat about the learner's day, likes and plans. You start by greeting them and asking how they are." },
  { id: "intro", label: "Meeting someone", blurb: "You meet someone at a party in Lisbon who asks about you.", text: "You meet the learner at a friend's party in Lisbon. Ask their name, where they're from and what they do." },
  { id: "cafe", label: "At a café", blurb: "Order a drink and something to eat from a waiter in Porto.", text: "You are a waiter at a café in Porto. The learner is the customer ordering a drink and something to eat." },
  { id: "weekend", label: "The weekend", blurb: "A friend asks what you did last weekend and what you'll do next.", text: "You are a friend asking what the learner did last weekend and what they'll do next weekend." },
  { id: "directions", label: "Asking the way", blurb: "Ask a local in Lisbon how to get to the station, a chemist or a museum.", text: "You are a local in Lisbon. The learner stops you to ask how to get somewhere (station, chemist, a museum)." },
];

// What the learner already knows, so the tutor keeps to their level.
function learnerContext(progress, scenario) {
  const words = openItems(progress.vocab.passedLevels).slice(-300).map(displayPt).join(", ");
  const practised = topics.filter((topic) => progress.grammar[topic.id]).map((topic) => topic.title);
  return {
    scenario: scenario.text,
    words,
    grammar: practised.length ? practised.join("; ") : "none yet, so keep to the present tense",
  };
}

function KeySetup({ onSaved }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveKey(key.trim());
      onSaved();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card tutor-setup">
      <h2 className="card-title">Add your free Gemini key</h2>
      <p>The tutor uses Google's Gemini AI. Google gives every Google account a free key, so this costs nothing.</p>
      <ol className="setup-steps">
        <li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a> and sign in with your Google account.</li>
        <li>Choose <strong>Create API key</strong> and copy it.</li>
        <li>Paste it here.</li>
      </ol>
      <form className="type-row" onSubmit={submit}>
        <input
          className="type-input key-input"
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Paste your API key"
          aria-label="Gemini API key"
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" className="btn btn-primary" disabled={!key.trim() || busy}>{busy ? "Checking…" : "Check and save"}</button>
      </form>
      {error && <p className="tutor-error" role="alert">{error}</p>}
      <p className="note">
        The key is saved in this browser only. It isn't in your backup file and is sent only to Google. Don't turn on
        billing for that Google project: on the free plan Google can't charge you, though it may use what you type to
        improve its AI.
      </p>
    </div>
  );
}

export default function Tutor({ progress }) {
  const [hasKey, setHasKey] = useState(() => Boolean(getKey()));
  const [scenario, setScenario] = useState(scenarios[0]);
  const [messages, setMessages] = useState([]); // { role: "learner" | "tutor", text, english?, corrections? }
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voiceNote, setVoiceNote] = useState("");
  const inputRef = useRef(null);
  const endRef = useRef(null);

  const started = messages.length > 0;
  const turns = messages.filter((m) => m.role === "learner").length;
  const finished = turns >= TURN_LIMIT;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);

  async function ask(history) {
    setBusy(true);
    setError("");
    try {
      const answer = await tutorTurn({ messages: history, context: learnerContext(progress, scenario) });
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        // Corrections belong to the learner's message they're about.
        if (last?.role === "learner") next[next.length - 1] = { ...last, corrections: answer.corrections };
        return [...next, { role: "tutor", text: answer.reply, english: answer.english }];
      });
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy || finished) return;
    const history = [...messages, { role: "learner", text }];
    setMessages(history);
    setDraft("");
    ask(history);
  }

  function retry() {
    ask(messages);
  }

  function restart() {
    setMessages([]);
    setError("");
    setDraft("");
  }

  function removeKey() {
    forgetKey();
    restart();
    setHasKey(false);
  }

  function addAccent(letter) {
    const field = inputRef.current;
    const start = field.selectionStart ?? draft.length;
    const end = field.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + letter + draft.slice(end));
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + 1, start + 1);
    });
  }

  async function say(text) {
    const outcome = await speak(text);
    setVoiceNote(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  // The last request failed and nothing answered it yet.
  const canRetry = error && !busy && (messages.length === 0 || messages[messages.length - 1].role === "learner");

  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Tutor</h1>
        <p className="muted">Chat in European Portuguese. The AI answers at your level and points out your mistakes.</p>
      </header>

      {!hasKey ? (
        <KeySetup onSaved={() => setHasKey(true)} />
      ) : !started && !busy && !error ? (
        <div className="card">
          <h2 className="card-title">What do you want to talk about?</h2>
          <div className="filters" role="group" aria-label="Situation">
            {scenarios.map((s) => (
              <button key={s.id} className={`filter ${scenario.id === s.id ? "is-on" : ""}`} aria-pressed={scenario.id === s.id} onClick={() => setScenario(s)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="muted">{scenario.blurb}</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => ask([])} disabled={usedToday() >= DAILY_LIMIT}>Start chatting</button>
          </div>
        </div>
      ) : (
        <div className="card tutor-chat">
          <div className="session-bar">
            <span className="chip">{scenario.label}</span>
            <button className="btn btn-quiet" onClick={restart}>New conversation</button>
          </div>

          <ul className="chat" aria-live="polite">
            {messages.map((message, index) =>
              message.role === "tutor" ? (
                <li key={index} className="bubble bubble-tutor">
                  <div className="bubble-line">
                    <p lang="pt-PT">{message.text}</p>
                    <button className="btn btn-icon btn-small" onClick={() => say(message.text)} aria-label="Listen">
                      <Icon name="speaker" size={16} />
                    </button>
                  </div>
                  {message.english && (
                    <details className="bubble-english">
                      <summary>English</summary>
                      <p>{message.english}</p>
                    </details>
                  )}
                </li>
              ) : (
                <li key={index} className="bubble bubble-learner">
                  <p lang="pt-PT">{message.text}</p>
                  {message.corrections?.length > 0 && (
                    <ul className="corrections">
                      {message.corrections.map((fix, i) => (
                        <li key={i}>
                          <span className="fix-wrong" lang="pt-PT">{fix.wrong}</span>{" "}
                          <span className="fix-right" lang="pt-PT">{fix.right}</span>
                          <span className="fix-why">{fix.why}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {message.corrections?.length === 0 && <p className="fix-none"><Icon name="check" size={14} /> No mistakes spotted</p>}
                </li>
              ),
            )}
            {busy && <li className="bubble bubble-tutor bubble-waiting" aria-label="The tutor is writing">…</li>}
          </ul>
          <div ref={endRef} />

          {error && (
            <div className="tutor-error-row" role="alert">
              <p className="tutor-error">{error}</p>
              {canRetry && <button className="btn" onClick={retry}>Try again</button>}
            </div>
          )}
          {voiceNote && <p className="note" role="status">{voiceNote}</p>}

          {finished ? (
            <p className="muted">That's {TURN_LIMIT} messages, the end of this conversation. Start a new one to keep going.</p>
          ) : (
            <form className="chat-form" onSubmit={send}>
              <div className="type-row">
                <input
                  ref={inputRef}
                  className="type-input chat-input"
                  lang="pt-PT"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Escreve em português…"
                  aria-label="Your message"
                  maxLength={600}
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-primary" disabled={!draft.trim() || busy}>Send</button>
              </div>
              <div className="accent-keys" aria-label="Accented letters">
                {ACCENTS.map((letter) => (
                  <button key={letter} type="button" className="accent-key" onClick={() => addAccent(letter)}>{letter}</button>
                ))}
              </div>
            </form>
          )}
        </div>
      )}

      {hasKey && (
        <div className="tutor-foot">
          <p className="note">
            {usedToday()} of {DAILY_LIMIT} tutor messages used today
            {started ? `, ${turns} of ${TURN_LIMIT} in this conversation` : ""}. Model: {getModel()}, key {keyHint(getKey())}.
          </p>
          <p className="note">
            AI replies aren't checked by a native speaker and can slip into Brazilian Portuguese. Trust your lessons over the tutor.
          </p>
          <button className="btn btn-quiet back-link" onClick={removeKey}>Remove key</button>
        </div>
      )}
    </section>
  );
}
