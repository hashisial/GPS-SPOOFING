"use client";

import { motion } from "framer-motion";

export function MetricCard({ label, value, hint, icon: Icon }) {
  return (
    <motion.article
      whileHover={{ y: -5, scale: 1.01 }}
      className="panel relative overflow-hidden p-5"
    >
      <div className="absolute -right-6 top-0 h-28 w-28 rounded-full bg-signal/10 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <div className="rounded-2xl border border-line/20 bg-surface-strong/60 p-3 text-signal">
          <Icon size={18} />
        </div>
      </div>
      <p className="relative mt-5 font-display text-4xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="relative mt-3 text-sm leading-6 text-text-muted">{hint}</p>
    </motion.article>
  );
}

