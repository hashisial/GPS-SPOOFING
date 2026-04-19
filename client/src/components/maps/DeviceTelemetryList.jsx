function formatTimestamp(value) {
  if (!value) {
    return "No signal";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function DeviceTelemetryList({ devices, selectedDeviceId, onSelectDevice }) {
  if (devices.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4 text-sm text-[var(--text-secondary)]">
        No devices are available for the current live monitoring filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <button
          key={device.id}
          type="button"
          onClick={() => onSelectDevice(device.id)}
          className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
            device.id === selectedDeviceId
              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--background-muted)] hover:border-[var(--accent)]"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {device.deviceName}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {device.deviceId}
              </div>
            </div>
            <div
              className={`rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] ${
                device.isOnline
                  ? "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]"
                  : "border-slate-500/20 bg-slate-500/10 text-slate-300"
              }`}
            >
              {device.isOnline ? "Online" : "Offline"}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Speed
              </div>
              <div className="mt-1 font-medium text-[var(--text-primary)]">
                {device.position ? `${device.position.speed} km/h` : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Last Seen
              </div>
              <div className="mt-1 font-medium text-[var(--text-primary)]">
                {formatTimestamp(device.position?.timestamp ?? device.lastSeen)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
