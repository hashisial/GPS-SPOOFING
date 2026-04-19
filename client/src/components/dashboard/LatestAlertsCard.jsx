import { PanelCard } from "./PanelCard.jsx";

const severityClassMap = {
  Low: "border-[#8B949E]/30 bg-[#8B949E]/10 text-[#C3CBD3]",
  Medium: "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]",
  High: "border-[#FF3B3B]/20 bg-[#FF3B3B]/10 text-[#FFAEAE]",
  Critical: "border-[#FF3B3B]/35 bg-[#FF3B3B]/14 text-[#FFD1D1]"
};

export function LatestAlertsCard({ alerts }) {
  return (
    <PanelCard
      eyebrow="Latest Alerts"
      title="Recent spoofing incidents"
      description="Operator queue for the most recent detections raised by the monitoring engine."
      className="h-full"
    >
      {alerts.length ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <article
              key={alert.id}
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
            </article>
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
