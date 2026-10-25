import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { findTopic } from "../../lib/grammar";
import { speak, speechMessages } from "../../lib/speech";

export default function GrammarTopic({ progress }) {
  const topic = findTopic(useParams().topicId);
  const [voiceNote, setVoiceNote] = useState("");

  if (!topic) return <Navigate to="/grammar" replace />;
  const score = progress.grammar?.[topic.id];

  async function say(text) {
    const outcome = await speak(text);
    setVoiceNote(outcome === "ok" ? "" : speechMessages[outcome]);
  }

  return (
    <section className="page">
      <Link to="/grammar" className="btn btn-quiet back-link">Back to Grammar</Link>
      <header className="page-head">
        <h1 className="page-title" lang="pt-PT">{topic.title}</h1>
        <p className="muted">{topic.summary}</p>
      </header>

      <div className="card grammar-card">
        {topic.intro.map((line) => <p key={line}>{line}</p>)}

        {topic.table && (
          <table className="verb-table">
            <caption className="visually-hidden">Present tense of {topic.title}</caption>
            <tbody>
              {topic.table.map((row) => (
                <tr key={row.person}>
                  <th scope="row" lang="pt-PT">{row.person}</th>
                  <td lang="pt-PT">{row.form}</td>
                  <td>
                    <button
                      className="btn btn-icon btn-small"
                      onClick={() => say(`${row.person.split(" / ")[0]} ${row.form}`)}
                      aria-label={`Listen to ${row.person.split(" / ")[0]} ${row.form}`}
                    >
                      <Icon name="speaker" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="grammar-examples">
          <h2 className="card-title">Examples</h2>
          {topic.examples.map((example) => (
            <div key={example.pt} className="example">
              <button className="btn btn-icon btn-small" onClick={() => say(example.pt)} aria-label={`Listen to ${example.pt}`}>
                <Icon name="speaker" size={16} />
              </button>
              <div>
                <p lang="pt-PT">{example.pt}</p>
                <p className="muted">{example.en}</p>
              </div>
            </div>
          ))}
        </div>

        {topic.notes?.length > 0 && (
          <ul className="grammar-notes">
            {topic.notes.map((note) => <li key={note} className="note">{note}</li>)}
          </ul>
        )}
        {voiceNote && <p className="note" role="status">{voiceNote}</p>}
      </div>

      <div className="card panel-row grammar-practice">
        <div>
          <h2 className="card-title">Practise {topic.title}</h2>
          <p className="muted">
            {topic.drills.length} questions, getting harder.
            {score ? ` Your best: ${score.best} of ${score.total} right first time.` : ""}
          </p>
        </div>
        <Link to={`/grammar/${topic.id}/practice`} className="btn btn-primary">{score ? "Practise again" : "Practise"}</Link>
      </div>

      <p className="note">Not yet checked by a native speaker.</p>
    </section>
  );
}
