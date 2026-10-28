import { Link } from "react-router-dom";
import { StageTag } from "../../components/Stages";
import { practiceStage } from "../../lib/mastery";
import { texts, wordCount } from "../../lib/reading";
import { findLevel, isLevelOpen } from "../../lib/vocab";

export default function ReadingHome({ progress }) {
  const open = texts.filter((text) => isLevelOpen(text.level, progress.vocab.passedLevels));
  const openLevels = [...new Set(open.map((text) => text.level))];
  const lockedCount = texts.length - open.length;

  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Reading</h1>
        <p className="muted">Texts that use the words from each Vocab level. Tap any word for its meaning, then answer the questions.</p>
      </header>

      {openLevels.map((levelId) => (
        <div key={levelId} className="page-section">
          <h2 className="section-title">Level {levelId}: {findLevel(levelId)?.title}</h2>
          <ul className="text-list">
            {open.filter((text) => text.level === levelId).map((text) => {
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
        </div>
      ))}

      <p className="note">
        {lockedCount > 0 ? `${lockedCount} more ${lockedCount === 1 ? "text opens" : "texts open"} as you pass Vocab level tests. ` : ""}
        None has been checked by a native speaker yet.
      </p>
    </section>
  );
}
