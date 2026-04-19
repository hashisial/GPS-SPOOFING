export function EmptyState({ title, description, action }) {
  return (
    <div className="panel flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <p className="font-display text-2xl font-semibold">{title}</p>
      <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

