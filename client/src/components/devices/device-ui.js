export const DEVICE_TYPES = ["TRACKER", "VEHICLE", "MOBILE", "DRONE"];
export const DEVICE_STATUSES = ["ONLINE", "OFFLINE", "MAINTENANCE", "DISABLED"];
export const DEVICE_ONLINE_FILTERS = ["ALL", "ONLINE", "OFFLINE"];

export function formatDeviceDate(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString();
}

export function formatDeviceTypeLabel(type) {
  return String(type ?? "UNKNOWN")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getDeviceStatusBadgeClass(status) {
  switch (status) {
    case "ONLINE":
      return "border-[#1BC2D5]/20 bg-[#1BC2D5]/10 text-[var(--text-primary)]";
    case "OFFLINE":
      return "border-[#145052]/25 bg-[#145052]/10 text-[var(--text-primary)]";
    case "MAINTENANCE":
      return "border-[#145052]/25 bg-[#145052]/10 text-[var(--text-primary)]";
    case "DISABLED":
      return "border-[#FFFFFF]/25 bg-[#FFFFFF]/10 text-[var(--text-primary)]";
    default:
      return "border-[#145052]/25 bg-[#145052]/10 text-[var(--text-primary)]";
  }
}
