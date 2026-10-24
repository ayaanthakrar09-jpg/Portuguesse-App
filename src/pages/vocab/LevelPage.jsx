import { Link, Navigate, useParams } from "react-router-dom";
import { dueCards } from "../../lib/srs";
import { dateKey } from "../../lib/storage";
import { findLevel, isLevelOpen } from "../../lib/vocab";
import { Meter } from "./VocabHome";

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
        <p className="muted">Each unit is one topic. Meet its words with flashcards, then type them from English.</p>
      </header>

      <ol className="units">
        {level.units.map((unit) => {
          const learned = unit.items.filter((item) => progress.cards[item.id]?.reps > 0).length;
          const due = dueCards(unit.items, progress.cards, today).length;
          const started = unit.items.some((item) => progress.cards[item.id]);
          const fresh = unit.items.filter((item) => !progress.cards[item.id]).length;
          const flashcardsLeft = due + fresh > 0;
          const typing = progress.vocab.typing?.[unit.id];
          return (
            <li key={unit.id} className="unit-row">
              <span className="unit-number" aria-hidden="true">{unit.number}</span>
              <div className="unit-body">
                <h2 className="card-title">{unit.title}</h2>
                <Meter value={learned} max={unit.items.length} label={`${learned} of ${unit.items.length} learned${due ? `, ${due} due` : ""}`} />
                {typing && <p className="meter-label">Typing best: {typing.best} of {typing.total} first time</p>}
              </div>
              <div className="unit-actions">
                {flashcardsLeft ? (
                  <Link to={`/vocab/unit/${unit.id}`} className={`btn ${unit === nextUnit ? "btn-primary" : ""}`}>
                    {started ? "Flashcards" : "Start"}
                  </Link>
                ) : (
                  <span className="unit-done">Flashcards done</span>
                )}
                {started && <Link to={`/vocab/unit/${unit.id}/type`} className="btn">Type it</Link>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
