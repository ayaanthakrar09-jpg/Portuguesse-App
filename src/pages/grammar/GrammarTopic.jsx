import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { findTopic } from "../../lib/grammar";
import { speak, speechMessages } from "../../lib/speech";
import RichText from "../../components/RichText";

// A topic has one verb `table`, or several `tables` (one per verb, with its meaning).
function verbTables(topic) {
  if (topic.tables) return topic.tables;
  return topic.table ? [{ verb: topic.title, rows: topic.table }] : [];
}

// What a row's Listen button says. Verb tables say the person and the form ("eu sou");
// other tables say just the form, or both sides ("o livro, os livros").
function spoken(table, row) {
  if (table.listen === "form") return row.form;
  if (table.listen === "both") return `${row.person}, ${row.form}`;
  return `${row.person.split(" / ")[0]} ${row.form}`;
}

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
        {topic.intro.map((line) => <p key={line}><RichText text={line} /></p>)}

        {verbTables(topic).map((table) => (
          <div key={table.verb} className="verb-block">
            {table.meaning && (
              <h2 className="card-title"><span lang="pt-PT">{table.verb}</span> <span className="muted">{table.meaning}</span></h2>
            )}
            <table className="verb-table">
              <caption className="visually-hidden">{table.caption ?? `Present tense of ${table.verb}`}</caption>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.person}>
                    <th scope="row" lang="pt-PT">{row.person}</th>
                    <td lang="pt-PT">{row.form}</td>
                    <td>
                      <button
                        className="btn btn-icon btn-small"
                        onClick={() => say(spoken(table, row))}
                        aria-label={`Listen to ${spoken(table, row)}`}
                      >
                        <Icon name="speaker" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

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
            {topic.notes.map((note) => <li key={note} className="note"><RichText text={note} /></li>)}
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
