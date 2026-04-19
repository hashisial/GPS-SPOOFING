"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Siren, X } from "lucide-react";

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en-US", {
    timeStyle: "short"
  }).format(new Date(value));
}

export function AlertPopups({ alerts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-6 top-24 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
      <AnimatePresence initial={false}>
        {alerts.map((alert) => (
          <motion.article
            key={alert.id}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.96 }}
            initial={{ opacity: 0, x: 72, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="pointer-events-auto relative overflow-hidden rounded-[1.75rem] border border-danger/30 bg-surface-strong/92 p-4 shadow-glow backdrop-blur-xl"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-danger via-accent to-signal" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-danger/15 text-danger">
                  <BellRing size={18} />
                  <span className="pulse-ring absolute inset-0 rounded-2xl border border-danger/30" />
                </div>
                <div>
                  <p className="eyebrow text-danger/80">Spoofing Alert</p>
                  <h4 className="mt-1 font-semibold text-text-primary">
                    {alert.device?.callsign ?? "Tracked asset"}
                  </h4>
                </div>
              </div>

              <button
                className="rounded-full border border-line/20 bg-surface/50 p-2 text-text-muted transition hover:border-danger/30 hover:text-text-primary"
                onClick={() => onDismiss(alert.id)}
                type="button"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-text-muted">{alert.description}</p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-danger/25 bg-danger/10 px-3 py-1 text-danger">
                <Siren size={14} />
                Confidence {Math.round(alert.confidence ?? 0)}%
              </span>
              <span className="text-text-muted">{formatTimestamp(alert.detectedAt)}</span>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
