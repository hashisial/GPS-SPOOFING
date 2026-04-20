export function PageIntro({ eyebrow, title, description }) {
  return (
    <div className="mb-5 min-w-0 sm:mb-6">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:text-xs sm:tracking-[0.24em]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}
