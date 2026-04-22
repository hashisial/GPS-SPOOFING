import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "../animations/MotionPrimitives.jsx";
import { SparklineChart } from "./SparklineChart.jsx";

const toneMap = {
  info: {
    accent: "#1BC2D5",
    badge: "text-[var(--text-primary)]"
  },
  success: {
    accent: "#1BC2D5",
    badge: "text-[var(--text-primary)]"
  },
  warning: {
    accent: "#145052",
    badge: "text-[#145052]"
  },
  danger: {
    accent: "#FFFFFF",
    badge: "text-[var(--text-primary)]"
  }
};

export function DashboardMetricCard({ title, value, change, tone = "info", trend = [] }) {
  const appearance = toneMap[tone] ?? toneMap.info;
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              scale: 1.015
            }
      }
      transition={{
        duration: 0.24,
        ease: "easeOut"
      }}
      className="dashboard-panel interactive-card group relative overflow-hidden rounded-[1.75rem] p-5"
    >
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
            <div className="text-3xl font-semibold text-[var(--text-primary)]">
              <AnimatedCounter value={value} />
            </div>
            <div className={`mt-2 text-sm ${appearance.badge}`}>{change}</div>
          </div>
          <div className="w-28">
            <SparklineChart values={trend} color={appearance.accent} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
