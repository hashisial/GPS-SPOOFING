import {
  REPORT_ALERT_STATUSES,
  REPORT_SEVERITIES,
  REPORT_TYPES
} from "./report-ui.js";

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]";

export function ReportGeneratorPanel({
  form,
  canGenerateReports,
  isSubmitting,
  errorMessage,
  successMessage,
  onFieldChange,
  onSubmit
}) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">Report Type</label>
          <select
            value={form.type}
            onChange={(event) => onFieldChange("type", event.target.value)}
            className={`${inputClassName} mt-2`}
          >
            {REPORT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">Report Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            className={`${inputClassName} mt-2`}
            placeholder="Optional custom title"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">Period Start</label>
          <input
            type="date"
            value={form.periodStart}
            onChange={(event) => onFieldChange("periodStart", event.target.value)}
            className={`${inputClassName} mt-2`}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">Period End</label>
          <input
            type="date"
            value={form.periodEnd}
            onChange={(event) => onFieldChange("periodEnd", event.target.value)}
            className={`${inputClassName} mt-2`}
          />
        </div>

        {form.type === "DEVICE" ? (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Device ID</label>
            <input
              type="text"
              value={form.deviceId}
              onChange={(event) => onFieldChange("deviceId", event.target.value)}
              className={`${inputClassName} mt-2`}
              placeholder="Enter the business device ID, for example GPS-001"
              required
            />
          </div>
        ) : null}

        {form.type === "INCIDENT" ? (
          <>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Severity</label>
              <select
                value={form.severity}
                onChange={(event) => onFieldChange("severity", event.target.value)}
                className={`${inputClassName} mt-2`}
              >
                <option value="">All Severities</option>
                {REPORT_SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Alert Status</label>
              <select
                value={form.status}
                onChange={(event) => onFieldChange("status", event.target.value)}
                className={`${inputClassName} mt-2`}
              >
                <option value="">All Statuses</option>
                {REPORT_ALERT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 px-4 py-3 text-sm text-[#FFB3B3]">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-[#00FFC6]/20 bg-[#00FFC6]/10 px-4 py-3 text-sm text-[#B8FFF0]">
          {successMessage}
        </div>
      ) : null}

      {!canGenerateReports ? (
        <div className="rounded-2xl border border-[#8B949E]/25 bg-[#8B949E]/10 px-4 py-3 text-sm text-[#C3CBD3]">
          Your role can download and review reports, but only Super Admins and Security Analysts can generate new ones.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
          Use the date filters to generate daily, weekly, monthly, device, or incident reports. The backend stores each generated report for later download.
        </p>

        <button
          type="submit"
          disabled={isSubmitting || !canGenerateReports}
          className="rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#0ea5e9)] px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Generating..." : "Generate Report"}
        </button>
      </div>
    </form>
  );
}
