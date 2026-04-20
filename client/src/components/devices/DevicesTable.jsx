import { DeviceStatusBadge } from "./DeviceStatusBadge.jsx";
import { formatDeviceDate, formatDeviceTypeLabel } from "./device-ui.js";

export function DevicesTable({
  devices,
  isLoading,
  canManageDevices,
  onEdit,
  onDelete
}) {
  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
        Loading devices...
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
        No devices matched the current search and filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-elevated)]">
      <div className="hidden grid-cols-[1fr_0.9fr_0.85fr_0.95fr_0.95fr_0.9fr] gap-4 border-b border-[var(--border)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:grid">
        <span>Device</span>
        <span>Type</span>
        <span>Owner</span>
        <span>Status</span>
        <span>Last Seen</span>
        <span>Actions</span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {devices.map((device) => (
          <div
            key={device.id}
            className="grid gap-4 px-4 py-5 transition hover:bg-white/[0.02] sm:px-5 lg:grid-cols-[1fr_0.9fr_0.85fr_0.95fr_0.95fr_0.9fr] lg:items-center"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--text-primary)]">{device.deviceName}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {device.deviceId}
              </div>
              {device.notes ? (
                <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {device.notes}
                </div>
              ) : null}
            </div>

            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Type
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--text-primary)] lg:mt-0">
                {formatDeviceTypeLabel(device.type)}
              </div>
            </div>

            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Owner
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)] lg:mt-0">
                {device.owner?.name ?? "Unassigned"}
              </div>
            </div>

            <div>
              <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Status
              </div>
              <DeviceStatusBadge status={device.status} />
            </div>

            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Last Seen
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)] lg:mt-0">
                {formatDeviceDate(device.lastSeen)}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:hidden">
                Actions
              </div>
              {canManageDevices ? (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(device)}
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] sm:tracking-[0.16em]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(device)}
                    className="rounded-xl border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#FFB3B3] transition sm:tracking-[0.16em]"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <span className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:tracking-[0.16em]">
                  View Only
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
