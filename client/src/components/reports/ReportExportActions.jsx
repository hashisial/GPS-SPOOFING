import { REPORT_EXPORT_FORMATS } from "./report-ui.js";

function getButtonLabel(format) {
  switch (format) {
    case "pdf":
      return "PDF";
    case "csv":
      return "CSV";
    case "excel":
      return "Excel";
    default:
      return format;
  }
}

export function ReportExportActions({
  report,
  onExport,
  loadingKey,
  compact = false
}) {
  if (!report?.id) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-start sm:justify-end"}`.trim()}>
      {REPORT_EXPORT_FORMATS.map((format) => {
        const exportKey = `${report.id}:${format}`;
        const isBusy = loadingKey === exportKey;

        return (
          <button
            key={format}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onExport(report, format);
            }}
            disabled={isBusy}
            className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition sm:tracking-[0.16em] ${
              compact
                ? "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                : "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isBusy ? "Downloading..." : getButtonLabel(format)}
          </button>
        );
      })}
    </div>
  );
}
