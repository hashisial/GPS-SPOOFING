export function PanelCard({ eyebrow, title, description, children, className = "" }) {
  return (
    <section className={`dashboard-panel rounded-[2rem] p-6 ${className}`.trim()}>
      <div className="mb-6">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
