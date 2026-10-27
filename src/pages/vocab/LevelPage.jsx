import { Link, Navigate, useParams } from "react-router-dom";
import { dueCards } from "../../lib/srs";
import { dateKey } from "../../lib/storage";
import { orderItems, TEST_LENGTH } from "../../lib/exercises";
import { findLevel, isLevelOpen, passMark } from "../../lib/vocab";
import { StageBar } from "../../components/Stages";
import { countStages } from "../../lib/mastery";

export default function LevelPage({ progress }) {
  const level = findLevel(useParams().levelId);
  if (!level || !isLevelOpen(level.id, progress.vocab.passedLevels)) return <Navigate to="/vocab" replace />;
  const today = dateKey();
  // Highlight only the next unit to work on: the first one with something due or unseen.
  const nextUnit = level.units.find((unit) => unit.items.some((item) => !progress.cards[item.id] || progress.cards[item.id].due <= today));

  return (
    <section className="page">
      <Link to="/vocab" className="btn btn-quiet back-link">Back to Vocab</Link>
      <header className="page-head">
        <h1 className="page-title">Level {level.id}: {level.title}</h1>
        <p className="muted">Each unit is one topic. Meet its words with flashcards, then multiple choice, then type them from English.</p>
      </header>

      <ol className="units">
        {level.units.map((unit) => {
          const due = dueCards(unit.items, progress.cards, today).length;
          const started = unit.items.some((item) => progress.cards[item.id]);
          const fresh = unit.items.filter((item) => !progress.cards[item.id]).length;
          const flashcardsLeft = due + fresh > 0;
          const choice = progress.vocab.choice?.[unit.id];
          const typing = progress.vocab.typing?.[unit.id];
          return (
            <li key={unit.id} className="unit-row">
              <span className="unit-number" aria-hidden="true">{unit.number}</span>
              <div className="unit-body">
                <h2 className="card-title">{unit.title}</h2>
                <StageBar counts={countStages(unit.items, progress.cards)} extra={due ? `${due} due for review` : ""} />
                {(choice || typing) && (
                  <p className="meter-label">
                    Best first time: {[choice && `multiple choice ${choice.best} of ${choice.total}`, typing && `typing ${typing.best} of ${typing.total}`].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <div className="unit-actions">
                {flashcardsLeft ? (
                  <Link to={`/vocab/unit/${unit.id}`} className={`btn ${unit === nextUnit ? "btn-primary" : ""}`}>
                    {started ? "Flashcards" : "Start"}
                  </Link>
                ) : (
                  <span className="unit-done">Flashcards done</span>
                )}
                {started && <Link to={`/vocab/unit/${unit.id}/choose`} className="btn">Multiple choice</Link>}
                {started && <Link to={`/vocab/unit/${unit.id}/type`} className="btn">Type it</Link>}
              </div>
            </li>
          );
        })}
      </ol>

      <WordOrderCard level={level} started={level.units.some((unit) => unit.items.some((item) => progress.cards[item.id]))} score={progress.vocab.order?.[level.id]} />

      <LevelTestCard level={level} result={progress.vocab.tests?.[level.id]} passed={progress.vocab.passedLevels.includes(level.id)} />
    </section>
  );
}

// Builds the level's longer phrases from their words. Opens once any unit has been started.
function WordOrderCard({ level, started, score }) {
  const count = orderItems(level).length;
  if (count === 0) return null;
  return (
    <div className="card panel-row word-order-card">
      <div>
        <h2 className="card-title">Word order</h2>
        <p className="muted">
          Build {count} phrases from this level, word by word.
          {score ? ` Your best: ${score.best} of ${score.total} right first time.` : started ? "" : " Start a unit first."}
        </p>
      </div>
      {started && <Link to={`/vocab/level/${level.id}/order`} className="btn">{score ? "Practise again" : "Start"}</Link>}
    </div>
  );
}

function LevelTestCard({ level, result, passed }) {
  return (
    <div className={`card test-card ${passed ? "is-passed" : ""}`}>
      <div>
        <h2 className="card-title">Level {level.id} test</h2>
        <p className="muted">
          {TEST_LENGTH} questions from all units, getting harder as you go. Pass with {Math.round(passMark * 100)}% to open the next level.
          Take it whenever you feel ready, as often as you like.
        </p>
      </div>
      {result && (
        <p>
          {passed ? "Passed. " : ""}Best score {result.best}%, last attempt {result.last.percent}%.
        </p>
      )}
      <div className="actions">
        <Link to={`/vocab/level/${level.id}/test`} className={`btn ${passed ? "" : "btn-primary"}`}>
          {result ? "Retake the test" : "Take the test"}
        </Link>
      </div>
    </div>
  );
}
