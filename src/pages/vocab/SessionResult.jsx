import { Link } from "react-router-dom";
import { displayPt } from "../../lib/vocab";

// End screen shared by the unit exercises: score, the items missed at the first attempt, and what to do next.
export default function SessionResult({ unit, missed, onAgain, againText }) {
  const total = unit.items.length;
  const score = total - missed.length;
  return (
    <section className="page">
      <h1 className="page-title">{score} of {total} right first time</h1>
      <div className="card">
        {missed.length === 0 ? (
          <p>Every answer was right at the first attempt.</p>
        ) : (
          <>
            <p>These come back sooner in your reviews:</p>
            <ul className="missed">
              {missed.map((item) => (
                <li key={item.id}>
                  <span lang="pt-PT">{displayPt(item)}</span>
                  <span className="muted">{item.en}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="actions">
          <Link to={`/vocab/level/${unit.level}`} className="btn btn-primary">Back to Level {unit.level}</Link>
          <button className="btn" onClick={onAgain}>{againText}</button>
        </div>
      </div>
    </section>
  );
}
