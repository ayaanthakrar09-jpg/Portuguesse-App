import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import { StageBar } from "../../components/Stages";
import { countStages } from "../../lib/mastery";
import { dueCards } from "../../lib/srs";
import { dateKey } from "../../lib/storage";
import { isLevelOpen, levels, openItems } from "../../lib/vocab";

export default function VocabHome({ progress }) {
  const passed = progress.vocab.passedLevels;
  const dueCount = dueCards(openItems(passed), progress.cards, dateKey()).length;

  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Vocab</h1>
        <p className="muted">Work through each level unit by unit. Words you get wrong come back sooner.</p>
        <p className="muted stage-key">
          <span className="stage-key-item"><span className="stage-tag is-weak">Weak</span> seen, not yet remembered a week later</span>
          <span className="stage-key-item"><span className="stage-tag is-secure">Secure</span> remembered after a week</span>
          <span className="stage-key-item"><span className="stage-tag is-mastered">Mastered</span> remembered after three weeks</span>
        </p>
      </header>

      <div className="panel panel-row">
        <span className="panel-icon"><Icon name="vocab" size={22} /></span>
        <div>
          <h2 className="card-title">Review</h2>
          <p className="muted">
            {dueCount === 0
              ? "Nothing due right now. Start or continue a unit below."
              : `${dueCount} ${dueCount === 1 ? "item is" : "items are"} due from the units you've started.`}
          </p>
        </div>
        {dueCount > 0 && <Link to="/vocab/review" className="btn btn-primary">Start review</Link>}
      </div>

      <ul className="levels">
        {levels.map((level) => {
          const open = isLevelOpen(level.id, passed);
          const items = level.units.flatMap((unit) => unit.items);
          return (
            <li key={level.id}>
              <div className={`level-card ${open ? "" : "is-locked"}`}>
                <span className="level-number" aria-hidden="true">{level.id}</span>
                <div className="level-body">
                  <h2 className="card-title">Level {level.id}: {level.title}</h2>
                  <p className="muted">
                    {level.units.length} units, {items.length} words and phrases
                  </p>
                  {open && <StageBar counts={countStages(items, progress.cards)} />}
                </div>
                {open ? (
                  <Link to={`/vocab/level/${level.id}`} className="btn btn-primary">Open</Link>
                ) : (
                  <p className="muted">Pass the Level {level.id - 1} test to open</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="note">
        More levels are added once Level 1 has been checked. Every item is marked as not yet checked by a native speaker.
      </p>
    </section>
  );
}

