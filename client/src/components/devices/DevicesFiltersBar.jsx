import {
  DEVICE_ONLINE_FILTERS,
  DEVICE_STATUSES,
  DEVICE_TYPES
} from "./device-ui.js";

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]";

export function DevicesFiltersBar({
  filters,
  draftSearch,
  canManageDevices,
  onDraftSearchChange,
  onSubmit,
  onFilterChange,
  onReset,
  onCreate
}) {
  return (
    <form
      className="grid gap-3 xl:grid-cols-[1.4fr_0.85fr_0.85fr_0.8fr_auto_auto]"
      onSubmit={onSubmit}
    >
      <input
        type="search"
        value={draftSearch}
        onChange={(event) => onDraftSearchChange(event.target.value)}
        placeholder="Search by device name, device ID, or notes"
        className={inputClassName}
      />

      <select
        value={filters.status}
        onChange={(event) => onFilterChange("status", event.target.value)}
        className={inputClassName}
      >
        <option value="">All Statuses</option>
        {DEVICE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(event) => onFilterChange("type", event.target.value)}
        className={inputClassName}
      >
        <option value="">All Types</option>
        {DEVICE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <select
        value={filters.online}
        onChange={(event) => onFilterChange("online", event.target.value)}
        className={inputClassName}
      >
        {DEVICE_ONLINE_FILTERS.map((value) => (
          <option key={value} value={value === "ALL" ? "" : value}>
            {value === "ALL" ? "All Connections" : `${value} Only`}
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

      {canManageDevices ? (
        <button
          type="button"
          onClick={onCreate}
          className="rounded-2xl bg-[linear-gradient(135deg,#00FFC6,#74FBE0)] px-5 py-3 text-sm font-semibold text-[#041018]"
        >
          Add Device
        </button>
      ) : null}
    </form>
  );
}
