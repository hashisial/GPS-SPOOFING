import { getSeverityBadgeClass, getStatusBadgeClass } from "./alert-ui.js";

export function AlertBadge({ variant = "severity", value }) {
  const className =
    variant === "status" ? getStatusBadgeClass(value) : getSeverityBadgeClass(value);

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] ${className}`}
    >
      {value}
    </span>
  );
}
