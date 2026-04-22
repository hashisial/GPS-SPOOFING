import {
  AnimatedButton,
  AnimatedItem,
  SkeletonBlock,
  StaggeredList
} from "../animations/MotionPrimitives.jsx";
import { AlertBadge } from "./AlertBadge.jsx";
import { canActOnAlert, formatAlertDate } from "./alert-ui.js";

function ActionButtons({ alert, canManageAlerts, onOpenDetails, onPrepareAction }) {
  if (!canManageAlerts) {
    return (
      <AnimatedButton
        type="button"
        onClick={() => onOpenDetails(alert.id)}
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] sm:w-auto sm:tracking-[0.16em]"
      >
        Details
      </AnimatedButton>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <AnimatedButton
        type="button"
        onClick={() => onOpenDetails(alert.id)}
        className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] sm:tracking-[0.16em]"
      >
        Details
      </AnimatedButton>
      <AnimatedButton
        type="button"
        disabled={!canActOnAlert(alert)}
        onClick={() => onPrepareAction(alert.id, "resolve")}
        className="rounded-xl border border-[#1BC2D5]/20 bg-[#1BC2D5]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition disabled:cursor-not-allowed disabled:opacity-40 sm:tracking-[0.16em]"
      >
        Resolve
      </AnimatedButton>
      <AnimatedButton
        type="button"
        disabled={!canActOnAlert(alert)}
        onClick={() => onPrepareAction(alert.id, "falsePositive")}
        className="rounded-xl border border-[#145052]/25 bg-[#145052]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition disabled:cursor-not-allowed disabled:opacity-40 sm:tracking-[0.16em]"
      >
        False Positive
      </AnimatedButton>
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
        <div className="mb-3">Loading alerts...</div>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} className="h-20 rounded-[1.25rem]" />
          ))}
        </div>
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

      <StaggeredList className="divide-y divide-[var(--border)]">
        {alerts.map((alert) => (
          <AnimatedItem key={alert.id} className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[1.2fr_0.95fr_0.9fr_0.8fr_0.8fr_1fr] lg:items-center">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--text-primary)]">{alert.title}</div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {alert.message}
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Risk Score {alert.riskScore}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Device
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{alert.deviceName}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {alert.deviceId}
              </div>
            </div>

            <div>
              <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Severity
              </div>
              <AlertBadge value={alert.severity} />
            </div>

            <div>
              <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Status
              </div>
              <AlertBadge variant="status" value={alert.status} />
            </div>

            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Triggered
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)] lg:mt-0">
                {formatAlertDate(alert.triggeredAt)}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Actions
              </div>
              <ActionButtons
                alert={alert}
                canManageAlerts={canManageAlerts}
                onOpenDetails={onOpenDetails}
                onPrepareAction={onPrepareAction}
              />
            </div>
          </AnimatedItem>
        ))}
      </StaggeredList>
    </div>
  );
}
