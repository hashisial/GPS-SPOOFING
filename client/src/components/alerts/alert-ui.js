export const ALERT_SEVERITIES = ["Low", "Medium", "High", "Critical"];
export const ALERT_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "FALSE_POSITIVE"];

export function formatAlertDate(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString();
}

export function getSeverityBadgeClass(severity) {
  switch (severity) {
    case "Low":
      return "border-[#145052]/30 bg-[#145052]/10 text-[var(--text-primary)]";
    case "Medium":
      return "border-[#1BC2D5]/20 bg-[#1BC2D5]/10 text-[var(--text-primary)]";
    case "High":
      return "border-[#1BC2D5]/25 bg-[#1BC2D5]/10 text-[var(--text-primary)]";
    case "Critical":
      return "border-[#FFFFFF]/35 bg-[#FFFFFF]/14 text-[var(--text-primary)]";
    default:
      return "border-[#145052]/25 bg-[#145052]/10 text-[var(--text-primary)]";
  }
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case "OPEN":
      return "border-[#FFFFFF]/30 bg-[#FFFFFF]/10 text-[var(--text-primary)]";
    case "ACKNOWLEDGED":
      return "border-[#145052]/25 bg-[#145052]/10 text-[var(--text-primary)]";
    case "RESOLVED":
      return "border-[#1BC2D5]/20 bg-[#1BC2D5]/10 text-[var(--text-primary)]";
    case "FALSE_POSITIVE":
      return "border-[#145052]/25 bg-[#145052]/10 text-[var(--text-primary)]";
    default:
      return "border-[#145052]/25 bg-[#145052]/10 text-[var(--text-primary)]";
  }
}

export function canActOnAlert(alert) {
  return alert?.status !== "RESOLVED" && alert?.status !== "FALSE_POSITIVE";
}
