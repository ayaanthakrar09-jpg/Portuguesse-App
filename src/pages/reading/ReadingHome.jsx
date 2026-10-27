import { Link } from "react-router-dom";
import { StageTag } from "../../components/Stages";
import { practiceStage } from "../../lib/mastery";
import { texts, wordCount } from "../../lib/reading";
import { isLevelOpen } from "../../lib/vocab";

export default function ReadingHome({ progress }) {
  const open = texts.filter((text) => isLevelOpen(text.level, progress.vocab.passedLevels));

  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Reading</h1>
        <p className="muted">Short texts using the words from Vocab. Tap any word for its meaning, then answer a few questions.</p>
      </header>

      <ul className="text-list">
        {open.map((text) => {
          const score = progress.reading?.[text.id];
          return (
            <li key={text.id}>
              <Link to={`/reading/${text.id}`} className="text-row">
                <span className="text-level" aria-hidden="true">{text.level}</span>
                <span className="text-body">
                  <span className="card-title" lang="pt-PT">{text.title}</span>
                  <span className="muted">
                    {text.titleEn}, {wordCount(text)} words
                    {score ? `, best ${score.best} of ${score.total} questions right` : ""}
                  </span>
                  {score && <span className="stage-line"><StageTag stage={practiceStage(score)} /></span>}
                </span>
                <span className="btn">{score ? "Read again" : "Read"}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="note">More texts come with each new level. None has been checked by a native speaker yet.</p>
    </section>
  );
}
