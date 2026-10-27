import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import { StageTag } from "../../components/Stages";
import { stages } from "../../lib/grammar";
import { practiceStage } from "../../lib/mastery";

export default function GrammarHome({ progress }) {
  const practised = (topic) => Boolean(progress.grammar?.[topic.id]);
  // Open the first section that still has topics to practise; the others stay folded until tapped.
  const current = stages.find((stage) => !stage.topics.every(practised)) ?? stages[0];

  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Grammar</h1>
        <p className="muted">Short explanations, then practice. Best done in this order.</p>
        <p className="muted stage-key">
          <span className="stage-key-item"><span className="stage-tag is-weak">Weak</span> last score under 80%</span>
          <span className="stage-key-item"><span className="stage-tag is-secure">Secure</span> 80% or more</span>
          <span className="stage-key-item"><span className="stage-tag is-mastered">Mastered</span> 80% on three days, a week apart</span>
        </p>
      </header>

      <div className="stages">
        {stages.map((stage) => {
          const done = stage.topics.filter(practised).length;
          return (
            <details key={stage.id} className="stage" open={stage === current}>
              <summary className="stage-summary">
                <span className="stage-chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
                <span className="stage-heading">
                  <span className="stage-title">{stage.title}</span>
                  <span className="muted">{stage.summary}</span>
                </span>
                <span className="stage-count">
                  {done} of {stage.topics.length}
                  <span className="stage-meter" aria-hidden="true"><span style={{ width: `${(done / stage.topics.length) * 100}%` }} /></span>
                </span>
              </summary>
              <ol className="topic-list">
                {stage.topics.map((topic) => {
                  const score = progress.grammar?.[topic.id];
                  return (
                    <li key={topic.id}>
                      <Link to={`/grammar/${topic.id}`} className={`topic-row ${score ? "is-done" : ""}`}>
                        <span className="topic-number" aria-hidden="true">
                          {score ? <Icon name="check" size={16} /> : topic.number}
                        </span>
                        <span className="topic-body">
                          <span className="topic-title" lang="pt-PT">{topic.title}</span>
                          <span className="muted">{topic.summary}</span>
                        </span>
                        <StageTag stage={practiceStage(score)} />
                        <span className="visually-hidden">{score ? `Best ${score.best} of ${score.total}` : "Not practised yet"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </div>

      <p className="note">Tap a section to open or close it. Nothing here has been checked by a native speaker yet.</p>
    </section>
  );
}
