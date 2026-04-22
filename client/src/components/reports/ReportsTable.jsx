import {
  AnimatedButton,
  AnimatedItem,
  SkeletonBlock,
  StaggeredList
} from "../animations/MotionPrimitives.jsx";
import { ReportExportActions } from "./ReportExportActions.jsx";
import {
  formatReportDate,
  formatReportPeriod,
  getReportTypeLabel
} from "./report-ui.js";

export function ReportsTable({
  reports,
  isLoading,
  selectedReportId,
  loadingKey,
  onSelect,
  onExport
}) {
  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
        <div className="mb-3">Loading reports...</div>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} className="h-20 rounded-[1.25rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
        No reports have been generated yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-elevated)]">
      <div className="hidden grid-cols-[1.2fr_0.7fr_0.9fr_0.85fr_1.2fr] gap-4 border-b border-[var(--border)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:grid">
        <span>Title</span>
        <span>Type</span>
        <span>Period</span>
        <span>Created</span>
        <span>Actions</span>
      </div>

      <StaggeredList className="divide-y divide-[var(--border)]">
        {reports.map((report) => {
          const isSelected = selectedReportId === report.id;

          return (
            <AnimatedItem
              key={report.id}
              className={`grid gap-4 px-4 py-5 transition sm:px-5 lg:grid-cols-[1.2fr_0.7fr_0.9fr_0.85fr_1.2fr] lg:items-center ${
                isSelected ? "bg-[var(--accent-soft)]/60" : "hover:bg-white/[0.02]"
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{report.title}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {report.id}
                </div>
              </div>

              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                  Type
                </div>
                <div className="mt-1 text-sm text-[var(--text-primary)] lg:mt-0">
                  {getReportTypeLabel(report.type)}
                </div>
              </div>

              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                  Period
                </div>
                <div className="mt-1 text-sm text-[var(--text-secondary)] lg:mt-0">
                  {formatReportPeriod(report)}
                </div>
              </div>

              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                  Created
                </div>
                <div className="mt-1 text-sm text-[var(--text-secondary)] lg:mt-0">
                  {formatReportDate(report.createdAt)}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                  Actions
                </div>
                <AnimatedButton
                  type="button"
                  onClick={() => onSelect(report.id)}
                  className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition sm:tracking-[0.16em] ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {isSelected ? "Selected" : "Open"}
                </AnimatedButton>

                <ReportExportActions
                  report={report}
                  onExport={onExport}
                  loadingKey={loadingKey}
                  compact
                />
              </div>
            </AnimatedItem>
          );
        })}
      </StaggeredList>
    </div>
  );
}
