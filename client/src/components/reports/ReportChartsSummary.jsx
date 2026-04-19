import {
  formatReportDate,
  formatReportPeriod,
  getBreakdownItems,
  getReportTypeLabel,
  getSummaryMetrics
} from "./report-ui.js";

function BreakdownChart({ title, items }) {
  if (!items.length) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          No chart data is available for this report yet.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5">
      <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#22d3ee)]"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportChartsSummary({ report, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
        Loading selected report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
        Generate a report or open one from history to view charts and summary metrics here.
      </div>
    );
  }

  const metrics = getSummaryMetrics(report.summary);
  const severityItems = getBreakdownItems(report, "Severity Breakdown");
  const statusItems = getBreakdownItems(report, "Status Breakdown");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Selected Report
          </div>
          <div className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{report.title}</div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
            <span>Type: {getReportTypeLabel(report.type)}</span>
            <span>Period: {formatReportPeriod(report)}</span>
            <span>Created: {formatReportDate(report.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.length ? (
          metrics.map((metric) => (
            <article
              key={metric.key}
              className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                {metric.label}
              </div>
              <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
                {metric.value}
              </div>
            </article>
          ))
        ) : (
          <article className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)] md:col-span-2 xl:col-span-4">
            This report does not include numeric summary metrics.
          </article>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownChart title="Severity Summary" items={severityItems} />
        <BreakdownChart title="Status Summary" items={statusItems} />
      </div>
    </div>
  );
}
