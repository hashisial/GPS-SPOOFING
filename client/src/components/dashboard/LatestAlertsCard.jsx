import { motion, useReducedMotion } from "framer-motion";
import { PanelCard } from "./PanelCard.jsx";

const severityClassMap = {
  Low: "border-[#145052]/30 bg-[#145052]/10 text-[var(--text-primary)]",
  Medium: "border-[#1BC2D5]/20 bg-[#1BC2D5]/10 text-[var(--text-primary)]",
  High: "border-[#FFFFFF]/20 bg-[#FFFFFF]/10 text-[var(--text-primary)]",
  Critical: "border-[#FFFFFF]/35 bg-[#FFFFFF]/14 text-[var(--text-primary)]"
};

export function LatestAlertsCard({ alerts }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <PanelCard
      eyebrow="Latest Alerts"
      title="Recent spoofing incidents"
      description="Operator queue for the most recent detections raised by the monitoring engine."
      className="h-full"
    >
      {alerts.length ? (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <motion.article
              key={alert.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      x: 4,
                      borderColor: "rgba(27, 194, 213, 0.65)"
                    }
              }
              transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : index * 0.04 }}
              className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4 transition hover:border-[var(--accent)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {alert.title}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                    {alert.device} - {alert.id}
                  </div>
                </div>
                <div
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    severityClassMap[alert.severity]
                  }`}
                >
                  {alert.severity}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{alert.summary}</p>
              <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                <span>Updated</span>
                <span>{alert.time}</span>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4 text-sm text-[var(--text-secondary)]">
          No recent alerts are available for the selected operational window.
        </div>
      )}
    </PanelCard>
  );
}
