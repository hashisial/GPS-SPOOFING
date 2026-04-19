"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";

const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statuses = ["OPEN", "ACKNOWLEDGED", "RESOLVED"];

export function FilterToolbar({
  filters,
  loading,
  onChange,
  onClear,
  resultCount
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 10 }}
      className="panel mb-6 overflow-hidden p-4"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-signal/12 p-3 text-signal">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <p className="eyebrow">Telemetry Filters</p>
            <p className="text-sm text-text-muted">
              Narrow the live queue and export exactly what operators are reviewing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">
            Results: <span className="text-text-primary">{resultCount}</span>
          </span>
          {loading ? <span className="chip text-signal">Refreshing...</span> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.6fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            className="field pl-11"
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Search by callsign, device label, rule, or alert description"
            value={filters.search}
          />
        </label>

        <select
          className="field"
          onChange={(event) => onChange("severity", event.target.value)}
          value={filters.severity}
        >
          <option value="">All severities</option>
          {severities.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>

        <select
          className="field"
          onChange={(event) => onChange("status", event.target.value)}
          value={filters.status}
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <button className="secondary-button" onClick={onClear} type="button">
          <X size={16} />
          Clear
        </button>
      </div>
    </motion.section>
  );
}
