export function PanelCard({ eyebrow, title, description, children, className = "" }) {
  return (
    <section className={`dashboard-panel rounded-[2rem] p-6 ${className}`.trim()}>
      <div className="mb-5 min-w-0 sm:mb-6">
        {eyebrow ? (
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:text-xs sm:tracking-[0.24em]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-lg font-semibold leading-tight text-[var(--text-primary)] sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
