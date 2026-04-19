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
      return "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]";
    case "OFFLINE":
      return "border-[#8B949E]/25 bg-[#8B949E]/10 text-[#C3CBD3]";
    case "MAINTENANCE":
      return "border-[#8B949E]/25 bg-[#8B949E]/10 text-[#C3CBD3]";
    case "DISABLED":
      return "border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FFB3B3]";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }
}
