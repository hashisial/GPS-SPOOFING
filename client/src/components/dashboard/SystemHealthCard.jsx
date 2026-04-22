import { motion, useReducedMotion } from "framer-motion";
import { PanelCard } from "./PanelCard.jsx";

const toneClassMap = {
  success: "text-[var(--text-primary)] border-[#1BC2D5]/20 bg-[#1BC2D5]/10",
  info: "text-[var(--text-primary)] border-[#1BC2D5]/16 bg-[#1BC2D5]/8",
  warning: "text-[#145052] border-[#145052]/20 bg-[#145052]/10",
  danger: "text-[var(--text-primary)] border-[#FFFFFF]/25 bg-[#FFFFFF]/12"
};

export function SystemHealthCard({ items, checklist }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <PanelCard
      eyebrow="System Health"
      title="Operational integrity status"
      description="Key platform surfaces with capacity, stability, and response guidance for the current shift."
      className="h-full"
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : index * 0.04 }}
            className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.label}
                </div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">{item.detail}</div>
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                  toneClassMap[item.tone] ?? toneClassMap.info
                }`}
              >
                {item.value}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#1BC2D5,#145052)]"
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          Shift Checklist
        </p>
        <ul className="mt-3 space-y-3">
          {checklist.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </PanelCard>
  );
}
