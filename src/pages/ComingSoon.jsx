export default function ComingSoon({ title, text, milestone }) {
  return (
    <section className="page">
      <h1 className="page-title">{title}</h1>
      <div className="card soon">
        <p>{text}</p>
        {milestone && <p className="muted">Not built yet. This arrives in Milestone {milestone}.</p>}
      </div>
    </section>
  );
}
