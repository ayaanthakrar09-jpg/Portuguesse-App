// A ring that fills as today's XP reaches the daily goal.
export default function GoalRing({ value, goal, size = 48 }) {
  const radius = 15.5;
  const length = 2 * Math.PI * radius;
  const share = Math.min(1, goal ? value / goal : 0);
  return (
    <svg className={`goal-ring ${share >= 1 ? "is-done" : ""}`} width={size} height={size} viewBox="0 0 36 36" role="img"
      aria-label={`${Math.min(value, goal)} of ${goal} XP today`}>
      <circle cx="18" cy="18" r={radius} className="goal-ring-track" />
      <circle cx="18" cy="18" r={radius} className="goal-ring-fill" strokeDasharray={length} strokeDashoffset={length * (1 - share)} />
      <text x="18" y="18" className="goal-ring-text">{Math.min(value, goal)}</text>
    </svg>
  );
}
