"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { Activity, MapPinned, RadioTower } from "lucide-react";
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

function QuickMetric({ label, value, icon: Icon }) {
  return (
    <div className="monitor-kpi">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-text-muted">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-wide">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-signal/15 text-signal">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export function HistoryConsole() {
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

  const { logs, summary, loading } = useLiveDetections(session?.token, liveFilters);

  if (authLoading && loading) {
    return (
      <SiteShell
        eyebrow="Telemetry Archive"
        loading
        onLogout={logout}
        session={session}
        subtitle="Loading GPS history."
        title="History"
      >
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-[460px] rounded-[2rem]" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell
      eyebrow="Telemetry Archive"
      loading={authLoading}
      onLogout={logout}
      session={session}
      subtitle="Inspect historical GPS points, speed, signal quality, and spoofing flags across the tracked fleet."
      title="History"
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
        resultCount={logs.length}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <QuickMetric icon={RadioTower} label="GPS Samples" value={logs.length} />
        <QuickMetric icon={MapPinned} label="Tracked Assets" value={summary.assetCount} />
        <QuickMetric icon={Activity} label="Spoofed Points" value={summary.spoofedPoints} />
      </section>

      <section className="monitor-panel mt-6 overflow-hidden p-4 sm:p-5">
        {logs.length === 0 ? (
          <EmptyState
            action={
              <Link href="/" className="primary-button">
                Back to dashboard
              </Link>
            }
            description="No telemetry points match the active filters."
            title="History is empty"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="monitor-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Coordinates</th>
                  <th>Speed</th>
                  <th>Signal</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div>
                        <p className="font-medium">{log.device?.label}</p>
                        <p className="mt-1 text-xs text-text-muted">{log.device?.callsign}</p>
                      </div>
                    </td>
                    <td>
                      {Number(log.latitude).toFixed(4)}, {Number(log.longitude).toFixed(4)}
                    </td>
                    <td>{Math.round(log.speedKph ?? 0)} kph</td>
                    <td>{Math.round(log.signalStrength ?? 0)}</td>
                    <td>{Math.round(log.alert?.confidence ?? log.spoofingScore ?? 0)}%</td>
                    <td>
                      <span className={`monitor-badge ${log.isSpoofed ? "text-danger" : "text-success"}`}>
                        {log.isSpoofed ? "Spoofed" : "Normal"}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-text-muted">
                        {new Date(log.timestamp).toLocaleString("en-US")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
