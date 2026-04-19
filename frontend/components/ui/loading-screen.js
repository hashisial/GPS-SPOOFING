"use client";

import { motion } from "framer-motion";

export function LoadingScreen({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-6 text-text-primary">
      <div className="panel relative max-w-md overflow-hidden px-8 py-10 text-center">
        <div className="absolute inset-x-12 top-8 h-24 rounded-full bg-signal/20 blur-3xl" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-signal/35"
        >
          <motion.div
            animate={{ scale: [0.92, 1.08, 0.92] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="h-10 w-10 rounded-full bg-signal/70 pulse-ring"
          />
        </motion.div>
        <p className="mt-6 font-display text-2xl font-semibold">Initializing secure telemetry</p>
        <p className="mt-3 text-sm text-text-muted">{label}</p>
      </div>
    </div>
  );
}

