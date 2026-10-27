import { useRef } from "react";

// Thin bar under a session's top bar, filling up as questions are finished.
// The total is the most questions there have been left; a wrong answer goes back in the queue, so the bar waits.
export default function SessionProgress({ left }) {
  const total = useRef(left);
  if (left > total.current) total.current = left;
  const done = total.current - left;
  return (
    <div className="test-track" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={total.current} aria-valuenow={done}>
      <span style={{ width: `${total.current ? (done / total.current) * 100 : 0}%` }} />
    </div>
  );
}
