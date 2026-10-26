import { Link } from "react-router-dom";
import { topics } from "../../lib/grammar";

export default function GrammarHome({ progress }) {
  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Grammar</h1>
        <p className="muted">The present tense: the verbs you'll use most and the regular verb patterns. Best done in this order.</p>
      </header>

      <ol className="units">
        {topics.map((topic) => {
          const score = progress.grammar?.[topic.id];
          return (
            <li key={topic.id} className="unit-row">
              <span className="unit-number" aria-hidden="true">{topic.number}</span>
              <div className="unit-body">
                <h2 className="card-title" lang="pt-PT">{topic.title}</h2>
                <p className="meter-label">
                  {topic.summary}
                  {score ? `. Best practice: ${score.best} of ${score.total} right first time` : ""}
                </p>
              </div>
              <div className="unit-actions">
                <Link to={`/grammar/${topic.id}`} className="btn">{score ? "Open" : "Start"}</Link>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="note">More verbs and tenses come later. Nothing here has been checked by a native speaker yet.</p>
    </section>
  );
}
