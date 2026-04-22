import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "../animations/MotionPrimitives.jsx";
import { PanelCard } from "./PanelCard.jsx";

function buildConicGradient(items) {
  let cursor = 0;

  return `conic-gradient(${items
    .map((item) => {
      const start = cursor;
      cursor += item.value;
      return `${item.color} ${start}% ${cursor}%`;
    })
    .join(", ")})`;
}

export function RiskOverviewCard({ score, delta, distribution }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <PanelCard
      eyebrow="Risk Overview"
      title="Threat distribution and weighted posture"
      description="Weighted severity mix across the fleet, combining alert density and active risk score."
    >
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-6">
          <motion.div
            className="relative grid h-44 w-44 place-items-center rounded-full"
            style={{ background: buildConicGradient(distribution) }}
            initial={shouldReduceMotion ? false : { rotate: -8, scale: 0.96, opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full border border-[var(--border)] bg-[var(--background)]">
              <div className="text-center">
                <div className="text-4xl font-semibold text-[var(--text-primary)]">
                  <AnimatedCounter value={score} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Risk Score
                </div>
              </div>
            </div>
          </motion.div>
          <div className="mt-4 rounded-full border border-[#1BC2D5]/20 bg-[#1BC2D5]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
            {delta} vs previous cycle
          </div>
        </div>

        <div className="space-y-4">
          {distribution.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {item.label}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  <AnimatedCounter value={item.value} suffix="%" />
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
                <motion.div
                  className="h-full rounded-full"
                  initial={shouldReduceMotion ? false : { width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.58, ease: "easeOut" }}
                  style={{
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PanelCard>
  );
}
