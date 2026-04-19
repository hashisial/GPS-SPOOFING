import { REPORT_TYPES } from "../constants/report.js";
import { ApiError } from "./ApiError.js";

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export function startOfUtcDay(value) {
  const date = toDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function endOfUtcDay(value) {
  const start = startOfUtcDay(value);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function startOfUtcWeek(value) {
  const date = startOfUtcDay(value);
  const utcDay = date.getUTCDay();
  const diff = utcDay === 0 ? -6 : 1 - utcDay;
  date.setUTCDate(date.getUTCDate() + diff);
  return startOfUtcDay(date);
}

export function endOfUtcWeek(value) {
  const start = startOfUtcWeek(value);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
}

export function startOfUtcMonth(value) {
  const date = toDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfUtcMonth(value) {
  const date = toDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) - 1);
}

export function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function normalizeDateRange(periodStart, periodEnd) {
  const start = periodStart ? new Date(periodStart) : null;
  const end = periodEnd ? new Date(periodEnd) : null;

  if (start && Number.isNaN(start.getTime())) {
    throw ApiError.badRequest("Invalid periodStart");
  }

  if (end && Number.isNaN(end.getTime())) {
    throw ApiError.badRequest("Invalid periodEnd");
  }

  if (start && end && start > end) {
    throw ApiError.badRequest("periodStart must be before periodEnd");
  }

  return {
    periodStart: start,
    periodEnd: end
  };
}

export function resolveReportPeriod(type, periodStart, periodEnd) {
  const normalized = normalizeDateRange(periodStart, periodEnd);

  if (normalized.periodStart && normalized.periodEnd) {
    return normalized;
  }

  const now = new Date();

  switch (type) {
    case REPORT_TYPES.DAILY:
      return {
        periodStart: normalized.periodStart ?? startOfUtcDay(now),
        periodEnd: normalized.periodEnd ?? endOfUtcDay(now)
      };
    case REPORT_TYPES.WEEKLY:
      return {
        periodStart: normalized.periodStart ?? startOfUtcWeek(now),
        periodEnd: normalized.periodEnd ?? endOfUtcWeek(now)
      };
    case REPORT_TYPES.MONTHLY:
      return {
        periodStart: normalized.periodStart ?? startOfUtcMonth(now),
        periodEnd: normalized.periodEnd ?? endOfUtcMonth(now)
      };
    case REPORT_TYPES.DEVICE:
    case REPORT_TYPES.INCIDENT:
      return {
        periodStart: normalized.periodStart ?? daysAgo(30),
        periodEnd: normalized.periodEnd ?? now
      };
    default:
      return normalized;
  }
}

export function formatDateTime(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toISOString();
}
