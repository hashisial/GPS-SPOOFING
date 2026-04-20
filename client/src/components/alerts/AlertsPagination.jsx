export function AlertsPagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const startPage = Math.max(1, pagination.page - 2);
  const endPage = Math.min(pagination.totalPages, startPage + 4);
  const pages = [];

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return (
    <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="text-sm text-[var(--text-secondary)]">
        Page {pagination.page} of {pagination.totalPages} - {pagination.total} alerts
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`rounded-xl border px-3 py-2 text-sm transition ${
              page === pagination.page
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
