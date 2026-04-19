"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { Activity, Radar, ShieldAlert, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useLiveDetections } from "@/hooks/useLiveDetections";
import { FilterToolbar } from "@/components/dashboard/filter-toolbar";

const initialFilters = {
  search: "",
  severity: "",
  status: ""
};

const ruleDefinitions = [
  {
    key: "SUDDEN_LOCATION_JUMP",
    label: "Sudden Jump"
  },
  {
    key: "IMPOSSIBLE_SPEED",
    label: "Impossible Speed"
  },
  {
    key: "SIGNAL_INCONSISTENCY",
    label: "Signal Drift"
  },
  {
    key: "ACCURACY_ANOMALY",
    label: "Accuracy Anomaly"
  }
];

function MetricCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <article className="monitor-kpi">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-text-muted">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-wide">{value}</p>
          <p className="mt-3 text-sm text-text-muted">{hint}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-[1rem] ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </article>
  );
}

export function DetectionsConsole() {
  const { session, loading: authLoading, logout } = useAuthSession();
  const [filters, setFilters] = useState(initialFilters);
  const deferredSearch = useDeferredValue(filters.search);

  const liveFilters = useMemo(
    () => ({
      search: deferredSearch,
      severity: filters.severity,
      status: filters.status
    }),
    [deferredSearch, filters.severity, filters.status]
  );

  const {
    alerts,
    logs,
    summary,
    focusDevice,
    deviceSnapshots,
    latestAlert,
    loading,
    mode,
    connected
  } = useLiveDetections(session?.token, liveFilters);

  const ruleCounts = useMemo(
    () =>
      ruleDefinitions.map((rule) => ({
        ...rule,
        count: alerts.reduce(
          (total, alert) => total + Number(alert.triggeredRules?.includes(rule.key)),
          0
        )
      })),
    [alerts]
  );

  const suspiciousLogs = useMemo(
    () => logs.filter((log) => log.isSpoofed).slice(0, 6),
    [logs]
  );

  if (authLoading && loading) {
    return (
      <SiteShell
        eyebrow="Detection Monitoring"
        loading
        onLogout={logout}
        session={session}
        subtitle="Loading detection telemetry."
        title="Detection"
      >
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-[1.5rem]" />
          <Skeleton className="h-[520px] rounded-[1.5rem]" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell
      actions={
        <Link href="/alerts" className="primary-button">
          <ShieldAlert size={16} />
          Open alerts
        </Link>
      }
      eyebrow="Detection Monitoring"
      loading={authLoading}
      onLogout={logout}
      session={session}
      subtitle="Track detection-rule activity, inspect suspicious GPS points, and review which assets are currently passing through the spoofing engine."
      title="Detection"
    >
      <FilterToolbar
        filters={filters}
        loading={loading}
        onChange={(field, value) => {
          startTransition(() => {
            setFilters((current) => ({
              ...current,
              [field]: value
            }));
          });
        }}
        onClear={() => {
          startTransition(() => {
            setFilters(initialFilters);
          });
        }}
        resultCount={alerts.length}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          hint="Open or acknowledged incidents in the active queue."
          icon={ShieldAlert}
          label="Open Incidents"
          tone="bg-danger/15 text-danger"
          value={summary.openIncidents}
        />
        <MetricCard
          hint="Devices currently represented in the detection model."
          icon={Radar}
          label="Tracked Assets"
          tone="bg-signal/15 text-signal"
          value={summary.assetCount}
        />
        <MetricCard
          hint="Flagged telemetry points inside the scoped window."
          icon={Activity}
          label="Spoofed Points"
          tone="bg-accent/15 text-accent"
          value={summary.spoofedPoints}
        />
        <MetricCard
          hint="Average scoring confidence for the visible queue."
          icon={ShieldCheck}
          label="Confidence"
          tone="bg-success/15 text-success"
          value={`${summary.averageConfidence.toFixed(1)}%`}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="monitor-panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Detection Queue</p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
                Triggered rules by asset
              </h3>
            </div>
            <span className="monitor-badge">
              Socket:{" "}
              <span className={connected ? "text-signal" : "text-text-primary"}>
                {connected ? "Connected" : mode}
              </span>
            </span>
          </div>

          {alerts.length === 0 ? (
            <EmptyState
              action={
                <Link href="/" className="primary-button">
                  Back to dashboard
                </Link>
              }
              description="No detections match the current filters."
              title="Detection queue is clear"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="monitor-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Rules</th>
                    <th>Severity</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <div>
                          <p className="font-medium">{alert.device?.label}</p>
                          <p className="mt-1 text-xs text-text-muted">{alert.device?.callsign}</p>
                        </div>
                      </td>
                      <td className="max-w-[18rem]">
                        <div className="flex flex-wrap gap-2">
                          {(alert.triggeredRules ?? []).map((rule) => (
                            <span key={rule} className="monitor-badge">
                              {rule.replaceAll("_", " ")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{alert.severity}</td>
                      <td>{Math.round(alert.confidence)}%</td>
                      <td>{alert.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="monitor-panel p-5">
            <div className="mb-4">
              <p className="eyebrow">Rule Summary</p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
                Engine breakdown
              </h3>
            </div>

            <div className="space-y-3">
              {ruleCounts.map((rule) => (
                <div
                  key={rule.key}
                  className="flex items-center justify-between rounded-[1rem] border border-line/15 bg-surface/52 px-4 py-3"
                >
                  <span className="text-sm text-text-primary">{rule.label}</span>
                  <span className="font-display text-xl text-text-primary">{rule.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="monitor-panel p-5">
            <div className="mb-4">
              <p className="eyebrow">Focused Device</p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
                {focusDevice?.label ?? "Awaiting stream"}
              </h3>
            </div>

            <div className="space-y-3">
              {deviceSnapshots.slice(0, 4).map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="rounded-[1rem] border border-line/15 bg-surface/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-primary">{snapshot.device?.callsign}</p>
                      <p className="text-sm text-text-muted">{snapshot.device?.label}</p>
                    </div>
                    <span
                      className={`monitor-badge ${
                        snapshot.isSpoofed ? "text-danger" : "text-success"
                      }`}
                    >
                      {snapshot.isSpoofed ? "Spoofed" : "Normal"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="monitor-panel p-5">
            <div className="mb-4">
              <p className="eyebrow">Suspicious Points</p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
                Latest flagged samples
              </h3>
            </div>

            <div className="space-y-3">
              {suspiciousLogs.length === 0 ? (
                <div className="rounded-[1rem] border border-dashed border-line/20 bg-surface/45 p-4 text-sm text-text-muted">
                  No suspicious samples are visible right now.
                </div>
              ) : (
                suspiciousLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-[1rem] border border-line/15 bg-surface/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{log.device?.callsign}</p>
                        <p className="text-sm text-text-muted">
                          {Number(log.latitude).toFixed(4)}, {Number(log.longitude).toFixed(4)}
                        </p>
                      </div>
                      <span className="text-sm text-danger">
                        {Math.round(log.alert?.confidence ?? log.spoofingScore ?? 0)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {latestAlert ? (
              <div className="mt-4 rounded-[1rem] border border-signal/20 bg-signal/10 p-4 text-sm text-text-primary">
                Latest alert: {latestAlert.device?.callsign} triggered{" "}
                {latestAlert.triggeredRules?.[0]?.replaceAll("_", " ") ?? "anomaly detection"}.
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
