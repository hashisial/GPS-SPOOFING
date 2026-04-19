"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const severityClasses = {
  LOW: "border-success/25 bg-success/10 text-success",
  MEDIUM: "border-accent/25 bg-accent/10 text-accent",
  HIGH: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  CRITICAL: "border-danger/25 bg-danger/10 text-danger"
};

const statusClasses = {
  OPEN: "text-danger",
  ACKNOWLEDGED: "text-accent",
  RESOLVED: "text-success",
  CLOSED: "text-text-muted"
};

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function EventFeed({ alerts, loading }) {
  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line/20 bg-surface/45 p-6 text-sm text-text-muted">
        No spoofing alerts are active. Live GPS telemetry is streaming normally.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.slice(0, 6).map((alert, index) => (
        <motion.article
          key={alert.id}
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: index * 0.04 }}
          whileHover={{ y: -3 }}
          className="rounded-3xl border border-line/20 bg-surface/55 p-4 transition hover:border-signal/30 hover:bg-surface/70"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-text-primary">{alert.device?.label}</p>
              <p className="text-sm text-text-muted">{alert.device?.callsign}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${severityClasses[alert.severity]}`}
            >
              {alert.severity}
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-text-muted">{alert.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(alert.triggeredRules ?? []).map((rule) => (
              <span
                key={rule}
                className="rounded-full border border-line/20 bg-surface-strong/55 px-3 py-1 text-[0.72rem] uppercase tracking-[0.18em] text-text-muted"
              >
                {rule.replaceAll("_", " ")}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="space-x-3">
              <span className={statusClasses[alert.status]}>{alert.status}</span>
              <span className="text-text-muted">Confidence {alert.confidence}%</span>
            </div>
            <span className="text-text-muted">{formatTimestamp(alert.detectedAt)}</span>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
