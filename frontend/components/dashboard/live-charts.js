"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ActivitySquare, RadioTower, ShieldAlert } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
import { Skeleton } from "@/components/ui/skeleton";

function ChartCard({ title, subtitle, icon: Icon, children }) {
  return (
    <article className="rounded-[1.75rem] border border-line/20 bg-surface/55 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{title}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-line/20 bg-surface-strong/60 p-3 text-signal">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-5 h-64">{children}</div>
    </article>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-line/20 bg-surface-strong/95 px-4 py-3 text-sm shadow-card backdrop-blur">
      <p className="font-medium text-text-primary">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-text-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}: </span>
            <span className="text-text-primary">{Math.round(entry.value ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveCharts({ chartSeries, focusDevice, loading }) {
  const { mounted, theme } = useTheme();
  const isLight = mounted && theme === "light";
  const chartPalette = useMemo(
    () => ({
      grid: isLight ? "rgba(71, 85, 105, 0.18)" : "rgba(148, 163, 184, 0.16)",
      axis: isLight ? "#475569" : "#94a3b8",
      speed: "#56c7ff",
      signal: "#7aa2ff",
      anomaly: "#ffc25c",
      confidence: "#ff6874"
    }),
    [isLight]
  );

  if (loading && chartSeries.length === 0) {
    return (
      <div className="grid gap-5 xl:grid-cols-3">
        <Skeleton className="h-[360px] rounded-[2rem]" />
        <Skeleton className="h-[360px] rounded-[2rem]" />
        <Skeleton className="h-[360px] rounded-[2rem]" />
      </div>
    );
  }

  if (chartSeries.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-line/20 bg-surface/50 p-8 text-sm text-text-muted">
        No chartable telemetry is available yet. Stream GPS data to render the live graphs.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Realtime Analytics</p>
          <h3 className="mt-2 font-display text-2xl font-semibold">
            {focusDevice?.label ?? "Live telemetry"} trend deck
          </h3>
        </div>
        <span className="chip">
          Focused asset:{" "}
          <span className="text-text-primary">
            {focusDevice?.callsign ?? "Awaiting stream"}
          </span>
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ChartCard
          icon={ActivitySquare}
          subtitle="Velocity trend across the focused device path."
          title="Speed Graph"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartSeries}>
              <defs>
                <linearGradient id="speedFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={chartPalette.speed} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={chartPalette.speed} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartPalette.grid} vertical={false} />
              <XAxis dataKey="label" stroke={chartPalette.axis} tickLine={false} />
              <YAxis stroke={chartPalette.axis} tickLine={false} width={38} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="speed"
                fill="url(#speedFill)"
                name="Speed kph"
                stroke={chartPalette.speed}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          icon={RadioTower}
          subtitle="Signal strength versus anomaly delta in realtime."
          title="Signal Anomaly"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartSeries}>
              <CartesianGrid stroke={chartPalette.grid} vertical={false} />
              <XAxis dataKey="label" stroke={chartPalette.axis} tickLine={false} />
              <YAxis stroke={chartPalette.axis} tickLine={false} width={38} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="signal"
                dot={false}
                name="Signal"
                stroke={chartPalette.signal}
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="anomaly"
                dot={false}
                name="Anomaly delta"
                stroke={chartPalette.anomaly}
                strokeDasharray="6 6"
                strokeWidth={2.4}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          icon={ShieldAlert}
          subtitle="Spoofing confidence score over the latest path samples."
          title="Detection Confidence"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartSeries}>
              <defs>
                <linearGradient id="confidenceFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={chartPalette.confidence} stopOpacity={0.36} />
                  <stop offset="95%" stopColor={chartPalette.confidence} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartPalette.grid} vertical={false} />
              <XAxis dataKey="label" stroke={chartPalette.axis} tickLine={false} />
              <YAxis domain={[0, 100]} stroke={chartPalette.axis} tickLine={false} width={38} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="confidence"
                fill="url(#confidenceFill)"
                name="Confidence %"
                stroke={chartPalette.confidence}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
