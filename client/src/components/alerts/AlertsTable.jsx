import { AlertBadge } from "./AlertBadge.jsx";
import { canActOnAlert, formatAlertDate } from "./alert-ui.js";

function ActionButtons({ alert, canManageAlerts, onOpenDetails, onPrepareAction }) {
  if (!canManageAlerts) {
    return (
      <button
        type="button"
        onClick={() => onOpenDetails(alert.id)}
        className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
      >
        Details
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onOpenDetails(alert.id)}
        className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
      >
        Details
      </button>
      <button
        type="button"
        disabled={!canActOnAlert(alert)}
        onClick={() => onPrepareAction(alert.id, "resolve")}
        className="rounded-xl border border-[#00FFC6]/20 bg-[#00FFC6]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9DFFEB] transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Resolve
      </button>
      <button
        type="button"
        disabled={!canActOnAlert(alert)}
        onClick={() => onPrepareAction(alert.id, "falsePositive")}
        className="rounded-xl border border-[#8B949E]/25 bg-[#8B949E]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C3CBD3] transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        False Positive
      </button>
    </div>
  );
}

export function AlertsTable({
  alerts,
  isLoading,
  canManageAlerts,
  onOpenDetails,
  onPrepareAction
}) {
  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
        Loading alerts...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
        No alerts matched the current search and filter criteria.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-elevated)]">
      <div className="hidden grid-cols-[1.2fr_0.95fr_0.9fr_0.8fr_0.8fr_1fr] gap-4 border-b border-[var(--border)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:grid">
        <span>Alert</span>
        <span>Device</span>
        <span>Severity</span>
        <span>Status</span>
        <span>Triggered</span>
        <span>Actions</span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {alerts.map((alert) => (
          <div key={alert.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_0.95fr_0.9fr_0.8fr_0.8fr_1fr] lg:items-center">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">{alert.title}</div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {alert.message}
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Risk Score {alert.riskScore}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{alert.deviceName}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {alert.deviceId}
              </div>
            </div>

            <div>
              <AlertBadge value={alert.severity} />
            </div>

            <div>
              <AlertBadge variant="status" value={alert.status} />
            </div>

            <div className="text-sm text-[var(--text-secondary)]">
              {formatAlertDate(alert.triggeredAt)}
            </div>

            <ActionButtons
              alert={alert}
              canManageAlerts={canManageAlerts}
              onOpenDetails={onOpenDetails}
              onPrepareAction={onPrepareAction}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
