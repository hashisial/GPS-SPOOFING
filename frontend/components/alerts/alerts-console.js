"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { BellRing, ShieldAlert, Siren, TriangleAlert } from "lucide-react";
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

function SummaryPill({ label, value, icon: Icon, tone }) {
  return (
    <div className="monitor-kpi">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-text-muted">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-wide">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export function AlertsConsole() {
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

  const { alerts, summary, loading } = useLiveDetections(session?.token, liveFilters);

  if (authLoading && loading) {
    return (
      <SiteShell
        eyebrow="Incident Monitoring"
        loading
        onLogout={logout}
        session={session}
        subtitle="Loading alert queue."
        title="Alerts"
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
      eyebrow="Incident Monitoring"
      loading={authLoading}
      onLogout={logout}
      session={session}
      subtitle="Review the full alert queue with severity, status, device context, and triggered spoofing rules."
      title="Alerts"
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

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryPill
          icon={ShieldAlert}
          label="Open Alerts"
          tone="bg-danger/15 text-danger"
          value={summary.openIncidents}
        />
        <SummaryPill
          icon={Siren}
          label="Critical"
          tone="bg-accent/15 text-accent"
          value={summary.criticalCount}
        />
        <SummaryPill
          icon={BellRing}
          label="Avg Confidence"
          tone="bg-signal/15 text-signal"
          value={`${summary.averageConfidence.toFixed(1)}%`}
        />
      </section>

      <section className="monitor-panel mt-6 overflow-hidden p-4 sm:p-5">
        {alerts.length === 0 ? (
          <EmptyState
            action={
              <Link href="/" className="primary-button">
                Back to dashboard
              </Link>
            }
            description="No alerts match the active filters."
            title="Alert queue is clear"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="monitor-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Rules</th>
                  <th>Detected</th>
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
                    <td>
                      <span className="monitor-badge">{alert.severity}</span>
                    </td>
                    <td>{alert.status}</td>
                    <td>{Math.round(alert.confidence)}%</td>
                    <td className="max-w-[18rem]">
                      <div className="flex flex-wrap gap-2">
                        {(alert.triggeredRules ?? []).slice(0, 2).map((rule) => (
                          <span key={rule} className="monitor-badge">
                            {rule.replaceAll("_", " ")}
                          </span>
                        ))}
                        {(alert.triggeredRules ?? []).length > 2 ? (
                          <span className="monitor-badge">
                            +{alert.triggeredRules.length - 2} more
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-text-muted">
                        {new Date(alert.detectedAt).toLocaleString("en-US")}
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
