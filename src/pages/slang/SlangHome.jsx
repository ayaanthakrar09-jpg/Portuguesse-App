import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import slang from "../../data/slang/pt-pt.json";
import { speak, speechMessages } from "../../lib/speech";
import { QUIZ_LENGTH } from "./SlangQuiz";

const formalityClass = { neutral: "", informal: "is-informal", rude: "is-rude", "very rude": "is-rude" };

export default function SlangHome({ progress }) {
  const [group, setGroup] = useState("all");
  const [showRude, setShowRude] = useState(false); // swear words stay hidden until switched on
  const [voiceNote, setVoiceNote] = useState("");

  const groups = slang.groups.filter((g) => g.id !== "rude" || showRude);
  const items = slang.items.filter((item) => (showRude || item.group !== "rude") && (group === "all" || item.group === group));

  async function say(text) {
    const outcome = await speak(text);
    setVoiceNote(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  function toggleRude(on) {
    setShowRude(on);
    if (!on && group === "rude") setGroup("all");
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Slang</h1>
        <p className="muted">Everyday expressions you'll hear in Portugal, with how casual they are and where they're used.</p>
      </header>

      <div className="panel panel-row slang-quiz">
        <div>
          <h2 className="card-title">Quiz yourself</h2>
          <p className="muted">
            {QUIZ_LENGTH} random expressions: pick what each one means.
            {progress.slang ? ` Your best: ${progress.slang.best} of ${progress.slang.total}.` : ""}
          </p>
        </div>
        <Link to="/slang/quiz" className="btn btn-primary">Start quiz</Link>
      </div>

      <div className="filters" role="group" aria-label="Show">
        <button className={`filter ${group === "all" ? "is-on" : ""}`} aria-pressed={group === "all"} onClick={() => setGroup("all")}>All</button>
        {groups.map((g) => (
          <button key={g.id} className={`filter ${group === g.id ? "is-on" : ""}`} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
            {g.title}
          </button>
        ))}
      </div>

      <label className="switch">
        <input type="checkbox" checked={showRude} onChange={(event) => toggleRude(event.target.checked)} />
        <span>Show swear words</span>
      </label>

      {voiceNote && <p className="note" role="status">{voiceNote}</p>}

      <ul className="slang-list">
        {items.map((item) => (
          <li key={item.id} className="slang-card">
            <div className="slang-head">
              <h2 className="slang-pt" lang="pt-PT">{item.pt}</h2>
              <button className="btn btn-icon btn-small" onClick={() => say(item.pt)} aria-label={`Listen to ${item.pt}`}>
                <Icon name="speaker" size={16} />
              </button>
            </div>
            <p className="slang-en">
              {item.en}
              {item.literal && <span className="muted"> (literally: {item.literal})</span>}
            </p>
            <div className="tags">
              <span className={`tag ${formalityClass[item.formality]}`}>{item.formality}</span>
              <span className="tag">{item.region}</span>
              {item.confidence !== "high" && <span className="tag is-unsure">Not sure: ask your native speaker</span>}
            </div>
            <div className="example">
              <button className="btn btn-icon btn-small" onClick={() => say(item.example.pt)} aria-label={`Listen to ${item.example.pt}`}>
                <Icon name="speaker" size={16} />
              </button>
              <div>
                <p lang="pt-PT">{item.example.pt}</p>
                <p className="muted">{item.example.en}</p>
              </div>
            </div>
            {item.note && <p className="note">{item.note}</p>}
          </li>
        ))}
      </ul>

      <p className="note">
        Slang changes fast and varies by region and age. None of this has been checked by a native speaker yet.
      </p>
    </section>
  );
}
