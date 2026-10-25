import { Link } from "react-router-dom";
import { recognitionMessages, recognitionSupported } from "../../lib/recognition";
import { isLevelOpen, levels } from "../../lib/vocab";

export default function SpeakingHome({ progress }) {
  const openLevels = levels.filter((level) => isLevelOpen(level.id, progress.vocab.passedLevels));

  return (
    <section className="page">
      <header className="page-head">
        <h1 className="page-title">Speaking</h1>
        <p className="muted">Hear a sentence, say it out loud, and see which words the browser understood.</p>
      </header>

      {!recognitionSupported() && <p className="note">{recognitionMessages.unsupported}</p>}

      {openLevels.map((level) => (
        <div key={level.id} className="page-section">
          <h2 className="section-title">Level {level.id}: {level.title}</h2>
          <ol className="units">
            {level.units.map((unit) => (
              <li key={unit.id} className="unit-row">
                <span className="unit-number" aria-hidden="true">{unit.number}</span>
                <div className="unit-body">
                  <h3 className="card-title">{unit.title}</h3>
                  <p className="meter-label">{unit.items.length} sentences from the Vocab unit</p>
                </div>
                <div className="unit-actions">
                  <Link to={`/speaking/${unit.id}`} className="btn">Practise</Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}

      <p className="note">
        This shows what the browser's speech recogniser wrote down. It is not a pronunciation score: recognisers also
        guess from context, so a word can be understood even if it sounded a little off. In Chrome and Edge your
        recording is sent to Google or Microsoft to be turned into text.
      </p>
    </section>
  );
}
