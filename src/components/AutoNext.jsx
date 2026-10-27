// After an answer is marked, the exercise moves on by itself: quickly when right, more slowly when not,
// so there's time to read the correction. Pause stops the countdown; Next (or Enter) still works any time.

import { useEffect, useRef, useState } from "react";

const QUICK_MS = 1000; // right first time
const SLOW_MS = 3000; // wrong, or right with an accent to check

// `answered`: whether the current question has been marked. `quick`: use the short wait.
export function useAutoNext(answered, quick, onNext) {
  const [paused, setPaused] = useState(false);
  const latest = useRef(onNext);
  latest.current = onNext;
  const delay = quick ? QUICK_MS : SLOW_MS;

  useEffect(() => {
    if (!answered) {
      setPaused(false);
      return undefined;
    }
    if (paused) return undefined;
    const timer = setTimeout(() => latest.current(), delay);
    return () => clearTimeout(timer);
  }, [answered, paused, delay]);

  return { running: answered && !paused, delay, pause: () => setPaused(true) };
}

// The countdown bar and Pause button. Put it next to the Next button.
export function AutoNextControl({ auto }) {
  if (!auto.running) return null;
  return (
    <div className="auto-next">
      <span className="auto-next-track" aria-hidden="true">
        <span style={{ animationDuration: `${auto.delay}ms` }} />
      </span>
      <button type="button" className="btn btn-quiet btn-small" onClick={auto.pause}>Pause</button>
    </div>
  );
}
