import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "../animations/MotionPrimitives.jsx";

export function MonitoringSummaryCard({ label, value, detail, tone = "info" }) {
  const shouldReduceMotion = useReducedMotion();
  const toneClassMap = {
    info: "border-[#1BC2D5]/20 bg-[#1BC2D5]/10 text-[var(--text-primary)]",
    success: "border-[#1BC2D5]/20 bg-[#1BC2D5]/10 text-[var(--text-primary)]",
    warning: "border-[#145052]/20 bg-[#145052]/10 text-[var(--text-primary)]"
  };

  return (
    <motion.article
      whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.015 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="dashboard-panel interactive-card flex min-h-[16rem] flex-col rounded-[1.6rem] p-5 sm:min-h-[14rem]"
    >
      <div className={`ui-label inline-flex max-w-full self-start rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase leading-5 tracking-[0.14em] ${toneClassMap[tone] ?? toneClassMap.info}`}>
        {label}
      </div>
      <div className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">
        <AnimatedCounter value={value} />
      </div>
      <div className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{detail}</div>
    </motion.article>
  );
}
