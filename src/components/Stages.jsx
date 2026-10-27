import { STAGES, stageLabel } from "../lib/mastery";

// One bar split into mastered, secure and weak, with the counts written underneath.
export function StageBar({ counts, extra }) {
  const total = counts.new + counts.weak + counts.secure + counts.mastered;
  const parts = STAGES.filter((stage) => counts[stage] > 0).map((stage) => `${counts[stage]} ${stage}`);
  if (counts.new > 0) parts.push(`${counts.new} new`);
  const label = [parts.join(", "), extra].filter(Boolean).join(". ");
  return (
    <div className="meter">
      <div className="meter-track stage-track" role="img" aria-label={label}>
        {STAGES.map((stage) => (
          <span key={stage} className={`stage-fill is-${stage}`} style={{ width: `${total ? (counts[stage] / total) * 100 : 0}%` }} />
        ))}
      </div>
      <span className="meter-label">{label}</span>
    </div>
  );
}

// A small coloured tag: Weak, Secure or Mastered.
export function StageTag({ stage }) {
  if (!stage) return null;
  return <span className={`stage-tag is-${stage}`}>{stageLabel[stage]}</span>;
}
