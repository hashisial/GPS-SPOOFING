import { SparklineChart } from "./SparklineChart.jsx";

const toneMap = {
  info: {
    accent: "#00FFC6",
    badge: "text-[#7FFFE5]"
  },
  success: {
    accent: "#00FFC6",
    badge: "text-[#B8FFF0]"
  },
  warning: {
    accent: "#8B949E",
    badge: "text-[#8B949E]"
  },
  danger: {
    accent: "#FF3B3B",
    badge: "text-[#FF8C8C]"
  }
};

export function DashboardMetricCard({ title, value, change, tone = "info", trend = [] }) {
  const appearance = toneMap[tone] ?? toneMap.info;

  return (
    <article className="dashboard-panel group relative overflow-hidden rounded-[1.75rem] p-5">
      <div
        className="pointer-events-none absolute right-[-1.5rem] top-[-1.5rem] h-24 w-24 rounded-full blur-3xl transition duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${appearance.accent}26` }}
      />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
          {title}
        </p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold text-[var(--text-primary)]">{value}</div>
            <div className={`mt-2 text-sm ${appearance.badge}`}>{change}</div>
          </div>
          <div className="w-28">
            <SparklineChart values={trend} color={appearance.accent} />
          </div>
        </div>
      </div>
    </article>
  );
}
