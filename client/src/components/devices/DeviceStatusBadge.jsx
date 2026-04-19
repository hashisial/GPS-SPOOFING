import { getDeviceStatusBadgeClass } from "./device-ui.js";

export function DeviceStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] ${getDeviceStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}
