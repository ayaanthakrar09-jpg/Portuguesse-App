export default function ComingSoon({ title, text, milestone, note }) {
  return (
    <section className="page">
      <h1 className="page-title">{title}</h1>
      <div className="card soon">
        <p>{text}</p>
        {title !== "Page not found" && (
          <p className="muted">{note ?? `Not built yet.${milestone ? ` This arrives in Milestone ${milestone}.` : ""}`}</p>
        )}
      </div>
    </section>
  );
}
