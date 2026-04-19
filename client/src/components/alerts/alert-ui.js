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
      return "border-[#8B949E]/30 bg-[#8B949E]/10 text-[#C3CBD3]";
    case "Medium":
      return "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]";
    case "High":
      return "border-[#FF7A7A]/25 bg-[#FF7A7A]/10 text-[#FFB3B3]";
    case "Critical":
      return "border-[#FF3B3B]/35 bg-[#FF3B3B]/14 text-[#FFD1D1]";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case "OPEN":
      return "border-[#FF3B3B]/30 bg-[#FF3B3B]/10 text-[#FFB3B3]";
    case "ACKNOWLEDGED":
      return "border-[#8B949E]/25 bg-[#8B949E]/10 text-[#C3CBD3]";
    case "RESOLVED":
      return "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]";
    case "FALSE_POSITIVE":
      return "border-[#8B949E]/25 bg-[#8B949E]/10 text-[#C3CBD3]";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }
}

export function canActOnAlert(alert) {
  return alert?.status !== "RESOLVED" && alert?.status !== "FALSE_POSITIVE";
}
