import { Link } from "react-router-dom";
import { stages } from "../../lib/grammar";

export default function GrammarHome({ progress }) {
  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Grammar</h1>
        <p className="muted">Short explanations, then practice. Best done in this order.</p>
      </header>

      {stages.map((stage) => (
        <section key={stage.id} className="grammar-stage" aria-labelledby={`stage-${stage.id}`}>
          <header>
            <h2 className="stage-title" id={`stage-${stage.id}`}>{stage.title}</h2>
            <p className="muted">{stage.summary}</p>
          </header>
          <ol className="units">
            {stage.topics.map((topic) => {
              const score = progress.grammar?.[topic.id];
              return (
                <li key={topic.id} className="unit-row">
                  <span className="unit-number" aria-hidden="true">{topic.number}</span>
                  <div className="unit-body">
                    <h3 className="card-title" lang="pt-PT">{topic.title}</h3>
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
        </section>
      ))}

      <p className="note">More stages come later: the past tenses, pronouns, commands, the future and the subjunctive. Nothing here has been checked by a native speaker yet.</p>
    </section>
  );
}
