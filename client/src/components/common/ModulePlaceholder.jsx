export function ModulePlaceholder({ summary, modules, notes }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 shadow-xl backdrop-blur">
      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Architecture Scope
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">{summary}</p>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Planned Modules
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {modules.map((module) => (
              <div
                key={module.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] p-4"
              >
                <h3 className="text-sm font-semibold">{module.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{module.description}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Notes
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {notes.map((note) => (
              <li key={note} className="rounded-xl border border-[var(--border)] px-3 py-2">
                {note}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
