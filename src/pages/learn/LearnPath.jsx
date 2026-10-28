import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DAILY_GOAL_XP, LESSONS_PER_UNIT, pathSteps, xpOn } from "../../lib/lessons";
import { setSoundOn, soundOn } from "../../lib/sound";
import { currentStreak, dateKey } from "../../lib/storage";
import GoalRing from "./GoalRing";

// The path wanders left and right like a walk through tiled streets.
const OFFSETS = [0, 1, 2, 1, 0, -1, -2, -1];

// The Learn path: every unit is a tile. Finished units turn into blue-and-white azulejos.
export default function LearnPath({ progress }) {
  const steps = pathSteps(progress);
  const xpToday = xpOn(progress, dateKey());
  const [sound, setSound] = useState(soundOn);
  const currentRef = useRef(null);
  useEffect(() => { currentRef.current?.scrollIntoView({ block: "center" }); }, []);

  function toggleSound() {
    setSoundOn(!sound);
    setSound(!sound);
  }

  const openLevels = steps.filter((step) => step.open);
  const lockedLevels = steps.filter((step) => !step.open);

  return (
    <section className="page learn">
      <header className="learn-head">
        <div>
          <h1 className="page-title">Learn</h1>
          <p className="muted">Short lessons, one unit at a time. Each unit has {LESSONS_PER_UNIT} lessons.</p>
        </div>
        <div className="learn-today">
          <GoalRing value={xpToday} goal={DAILY_GOAL_XP} size={56} />
          <div>
            <p className="learn-today-title">{xpToday >= DAILY_GOAL_XP ? "Daily goal reached" : `${xpToday} of ${DAILY_GOAL_XP} XP today`}</p>
            <p className="muted">{currentStreak(progress.days)} day streak</p>
          </div>
          <button type="button" className="btn btn-quiet" onClick={toggleSound} aria-pressed={sound}>
            Sound {sound ? "on" : "off"}
          </button>
        </div>
      </header>

      {openLevels.map(({ level, units, test }) => (
        <section key={level.id} className="path-level">
          <h2 className="path-level-title">Level {level.id}: {level.title}</h2>
          <ol className="path">
            {units.map((step, i) => (
              <li key={step.unit.id} className="path-step" style={{ "--offset": OFFSETS[i % OFFSETS.length] }} ref={step.current ? currentRef : undefined}>
                <Link
                  to={`/learn/${step.unit.id}`}
                  className={`path-node ${step.done ? "is-done" : ""} ${step.current ? "is-current" : ""}`}
                  aria-label={`${step.unit.title}: ${step.count} of ${LESSONS_PER_UNIT} lessons done`}
                >
                  {step.current && <span className="path-start">{step.count ? "Continue" : "Start"}</span>}
                  <span className="path-tile" aria-hidden="true" />
                  <span className="path-label">
                    <span className="path-title">{step.unit.title}</span>
                    <span className="path-pips" aria-hidden="true">
                      {Array.from({ length: LESSONS_PER_UNIT }, (_, n) => <span key={n} className={n < step.count ? "is-on" : ""} />)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            <li className="path-step" style={{ "--offset": OFFSETS[units.length % OFFSETS.length] }} ref={test.current ? currentRef : undefined}>
              <Link to={`/vocab/level/${level.id}/test`} className={`path-node path-test ${test.passed ? "is-done" : ""} ${test.current ? "is-current" : ""}`}>
                {test.current && <span className="path-start">Ready</span>}
                <span className="path-tile" aria-hidden="true">{test.passed ? "" : "Test"}</span>
                <span className="path-label">
                  <span className="path-title">Level {level.id} test</span>
                  <span className="muted">{test.passed ? "Passed" : "Pass it to open the next level"}</span>
                </span>
              </Link>
            </li>
          </ol>
        </section>
      ))}

      {lockedLevels.length > 0 && (
        <section className="path-locked">
          <h2 className="path-level-title">Still to come</h2>
          <ul>
            {lockedLevels.map(({ level }) => (
              <li key={level.id}><span className="path-lock-tile" aria-hidden="true" />Level {level.id}: {level.title}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="note">Lessons use the example sentences from Vocab. None of them has been checked by a native speaker yet.</p>
    </section>
  );
}
