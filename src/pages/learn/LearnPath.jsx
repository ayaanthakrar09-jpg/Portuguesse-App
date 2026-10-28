import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DAILY_GOAL_XP, LESSONS_PER_UNIT, pathSteps, xpOn } from "../../lib/lessons";
import { setSoundOn, soundOn } from "../../lib/sound";
import { currentStreak, dateKey } from "../../lib/storage";
import GoalRing from "./GoalRing";

// Each level takes one of Portugal's colours in turn: the flag's red, green and gold, and azulejo blue.
const LEVEL_COLOURS = ["red", "green", "gold", "blue"];

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

  // One position counter for the whole road, so it keeps winding from one level into the next.
  let position = 0;
  const offset = () => OFFSETS[position++ % OFFSETS.length];

  return (
    <section className="page learn">
      <header className="learn-head">
        <div>
          <h1 className="page-title">Learn</h1>
          <p className="muted">Start here: lessons teach each new word, so you don't need Vocab first. Use Vocab to look words up or for extra practice.</p>
          <p className="muted">One road through all {steps.length} levels. Each unit has {LESSONS_PER_UNIT} lessons, the last a review; each level ends with a checkpoint that opens the next.</p>
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

      {steps.map(({ level, open, units, test }) => (
        <section key={level.id} className={`path-level paint-${LEVEL_COLOURS[(level.id - 1) % LEVEL_COLOURS.length]} ${open ? "" : "is-locked"}`}>
          <div className="path-level-head">
            <h2 className="path-level-title"><span className="level-badge">Level {level.id}</span>{level.title}</h2>
            {!open && <p className="muted">Pass the Level {level.id - 1} checkpoint to open</p>}
          </div>
          <ol className="path">
            {units.map((step) => (
              <li key={step.unit.id} className="path-step" style={{ "--offset": offset() }} ref={step.current ? currentRef : undefined}>
                <PathNode
                  to={open ? `/learn/${step.unit.id}` : null}
                  className={`${step.done ? "is-done" : ""} ${step.current ? "is-current" : ""}`}
                  label={open ? `${step.unit.title}: ${step.count} of ${LESSONS_PER_UNIT} lessons done` : `${step.unit.title}, locked`}
                >
                  {step.current && <span className="path-start">{step.count ? "Continue" : "Start"}</span>}
                  <span className="path-tile" aria-hidden="true" />
                  <span className="path-label">
                    <span className="path-title">{step.unit.title}</span>
                    {open && (
                      <span className="path-pips" aria-hidden="true">
                        {Array.from({ length: LESSONS_PER_UNIT }, (_, n) => <span key={n} className={n < step.count ? "is-on" : ""} />)}
                      </span>
                    )}
                  </span>
                </PathNode>
              </li>
            ))}
            <li className="path-step" style={{ "--offset": offset() }} ref={test.current ? currentRef : undefined}>
              <PathNode
                to={open ? `/learn/checkpoint/${level.id}` : null}
                className={`path-test ${test.passed ? "is-done" : ""} ${test.current ? "is-current" : ""}`}
                label={`Level ${level.id} checkpoint${test.passed ? ", passed" : ""}`}
              >
                {test.current && <span className="path-start">Ready</span>}
                <span className="path-tile" aria-hidden="true">{test.passed ? "" : "Test"}</span>
                <span className="path-label">
                  <span className="path-title">Level {level.id} checkpoint</span>
                  {open && <span className="muted">{test.passed ? "Passed" : "20 questions, 80% opens the next level"}</span>}
                </span>
              </PathNode>
            </li>
          </ol>
        </section>
      ))}

      <p className="note">Lessons use the example sentences from Vocab. None of them has been checked by a native speaker yet.</p>
    </section>
  );
}

// A step on the road: a link while its level is open, plain and faded while it's locked.
function PathNode({ to, className, label, children }) {
  if (!to) return <div className={`path-node is-locked ${className}`} aria-label={label}>{children}</div>;
  return <Link to={to} className={`path-node ${className}`} aria-label={label}>{children}</Link>;
}
