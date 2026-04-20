import { ALERT_SEVERITIES, ALERT_STATUSES } from "./alert-ui.js";

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]";

export function AlertsFiltersBar({
  filters,
  draftSearch,
  onDraftSearchChange,
  onSubmit,
  onFilterChange,
  onReset
}) {
  return (
    <form className="grid gap-3 lg:grid-cols-[1.4fr_repeat(2,0.8fr)_auto]" onSubmit={onSubmit}>
      <input
        type="search"
        value={draftSearch}
        onChange={(event) => onDraftSearchChange(event.target.value)}
        placeholder="Search by title, message, device ID, or device name"
        className={inputClassName}
      />

      <select
        value={filters.severity}
        onChange={(event) => onFilterChange("severity", event.target.value)}
        className={inputClassName}
      >
        <option value="">All Severities</option>
        {ALERT_SEVERITIES.map((severity) => (
          <option key={severity} value={severity}>
            {severity}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(event) => onFilterChange("status", event.target.value)}
        className={inputClassName}
      >
        <option value="">All Statuses</option>
        {ALERT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
        >
          Search
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
