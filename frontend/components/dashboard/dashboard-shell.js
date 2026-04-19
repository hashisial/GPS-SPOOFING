"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  FileSpreadsheet,
  FileText,
  Radar,
  RadioTower,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Waypoints
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useLiveDetections } from "@/hooks/useLiveDetections";
import { apiDownload } from "@/lib/api";
import { mockSystemSettings } from "@/lib/mock-data";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { AlertPopups } from "./alert-popups";
import { EventFeed } from "./event-feed";
import { FilterToolbar } from "./filter-toolbar";
import { LiveMap } from "./live-map";

const LiveCharts = dynamic(
  () => import("./live-charts").then((module) => module.LiveCharts),
  {
    ssr: false,
    loading: () => <div className="skeleton h-[360px] rounded-[1.5rem]" />
  }
);

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

function OverviewCard({ label, value, hint, icon: Icon, tone = "signal" }) {
  const toneClasses = {
    signal: "text-signal",
    success: "text-success",
    danger: "text-danger",
    accent: "text-accent"
  };

  return (
    <motion.article whileHover={{ y: -3 }} className="monitor-kpi">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(86,199,255,0.42),transparent)]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-text-muted">
            {label}
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-wide">{value}</p>
          <p className="mt-3 text-sm leading-6 text-text-muted">{hint}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[1rem] border border-line/10 bg-surface-strong/55 ${toneClasses[tone]}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </motion.article>
  );
}

function OpsStatusPanel({ connected, mode, latestLog, latestAlert, focusDevice, thresholds }) {
  const spoofed = Boolean(latestLog?.isSpoofed);

  return (
    <section className="monitor-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Detection Status</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
            {spoofed ? "Threat Detected" : "Telemetry Stable"}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${
            spoofed ? "bg-danger/15 text-danger" : "bg-success/15 text-success"
          }`}
        >
          {spoofed ? <Siren size={20} /> : <ShieldCheck size={20} />}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="monitor-badge">
          Socket:{" "}
          <span className={connected ? "text-signal" : "text-text-primary"}>
            {connected ? "Connected" : "Offline"}
          </span>
        </span>
        <span className="monitor-badge">
          Mode: <span className="text-text-primary">{mode}</span>
        </span>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-muted">Focused asset</span>
          <span className="text-right text-text-primary">
            {focusDevice?.callsign ?? "Awaiting stream"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-muted">Latest speed</span>
          <span className="text-text-primary">{Math.round(latestLog?.speedKph ?? 0)} kph</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-muted">Confidence threshold</span>
          <span className="text-text-primary">{thresholds.confidenceThreshold}%</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-muted">Last triggered rule</span>
          <span className="max-w-[10rem] text-right text-text-primary">
            {latestAlert?.triggeredRules?.[0]?.replaceAll("_", " ") ?? "None"}
          </span>
        </div>
      </div>
    </section>
  );
}

function DeviceMonitor({ deviceSnapshots, focusDevice }) {
  return (
    <section className="monitor-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Device Monitor</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
            Live asset roster
          </h3>
        </div>
        <span className="monitor-badge">
          Active: <span className="text-text-primary">{deviceSnapshots.length}</span>
        </span>
      </div>

      <div className="space-y-3">
        {deviceSnapshots.slice(0, 5).map((snapshot) => {
          const confidence = Math.round(
            snapshot.alert?.confidence ?? snapshot.spoofingScore ?? 0
          );
          const focused = snapshot.deviceId === focusDevice?.id;

          return (
            <div
              key={snapshot.id}
              className={`rounded-[1.1rem] border p-4 ${
                focused
                  ? "border-signal/30 bg-surface-strong/55"
                  : "border-line/15 bg-surface/50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{snapshot.device?.label}</p>
                  <p className="text-sm text-text-muted">{snapshot.device?.callsign}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    snapshot.isSpoofed
                      ? "bg-danger/12 text-danger"
                      : "bg-success/12 text-success"
                  }`}
                >
                  {snapshot.isSpoofed ? "Spoofed" : "Safe"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-text-muted">
                <span>{Math.round(snapshot.speedKph ?? 0)} kph</span>
                <span>Signal {Math.round(snapshot.signalStrength ?? 0)}</span>
                <span>{confidence}% score</span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-strong/70">
                <div
                  className={`h-full rounded-full ${
                    snapshot.isSpoofed ? "bg-danger" : "bg-signal"
                  }`}
                  style={{ width: `${Math.max(confidence, 10)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RuleMatrix({ alerts }) {
  const ruleCounts = useMemo(() => {
    return ruleDefinitions.map((rule) => ({
      ...rule,
      count: alerts.reduce(
        (total, alert) => total + Number(alert.triggeredRules?.includes(rule.key)),
        0
      )
    }));
  }, [alerts]);

  return (
    <section className="monitor-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Rule Matrix</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
            Detection engine
          </h3>
        </div>
        <Radar className="text-signal" size={18} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {ruleCounts.map((rule) => (
          <div
            key={rule.key}
            className="rounded-[1.1rem] border border-line/15 bg-surface/52 p-4"
          >
            <p className="text-sm font-semibold text-text-primary">{rule.label}</p>
            <p className="mt-2 text-3xl font-display text-text-primary">{rule.count}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-text-muted">
              rule hits
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FocusTrackTable({ focusTrack, focusDevice }) {
  const rows = focusTrack.slice(-6).reverse();

  return (
    <section className="monitor-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Telemetry Trail</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
            {focusDevice?.callsign ?? "Focused asset"}
          </h3>
        </div>
        <span className="monitor-badge">
          Samples: <span className="text-text-primary">{focusTrack.length}</span>
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[1.1rem] border border-dashed border-line/20 bg-surface/45 p-6 text-sm text-text-muted">
          No focused telemetry samples are available yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="monitor-table min-w-full">
            <thead>
              <tr>
                <th>Time</th>
                <th>Coordinates</th>
                <th>Speed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((point) => (
                <tr key={point.id}>
                  <td>{new Date(point.timestamp).toLocaleTimeString("en-US")}</td>
                  <td>
                    {Number(point.latitude).toFixed(4)}, {Number(point.longitude).toFixed(4)}
                  </td>
                  <td>{Math.round(point.speedKph ?? 0)} kph</td>
                  <td>
                    <span
                      className={`monitor-badge ${
                        point.isSpoofed ? "text-danger" : "text-success"
                      }`}
                    >
                      {point.isSpoofed ? "Spoofed" : "Normal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function DashboardShell() {
  const { session, loading: authLoading, logout } = useAuthSession();
  const [filters, setFilters] = useState(initialFilters);
  const [exporting, setExporting] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const deferredSearch = useDeferredValue(filters.search);
  const thresholds = mockSystemSettings;

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
    pagination,
    latestAlert,
    latestLog,
    focusDevice,
    focusTrack,
    deviceSnapshots,
    chartSeries,
    loading,
    mode,
    connected,
    popupAlerts,
    dismissPopup
  } = useLiveDetections(session?.token, liveFilters);

  const suspiciousDevices = useMemo(
    () => new Set(alerts.map((alert) => alert.deviceId)).size,
    [alerts]
  );

  const exportQuery = useMemo(
    () => ({
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      spoofedOnly: true
    }),
    [filters.severity, filters.status]
  );

  const actions = useMemo(
    () => (
      <>
        <button
          className="secondary-button"
          disabled={!session?.token || exporting === "csv"}
          onClick={async () => {
            if (!session?.token) {
              setStatusMessage("Login is required to export secured reports.");
              return;
            }

            setExporting("csv");
            setStatusMessage("");

            try {
              await apiDownload("/reports/export.csv", {
                token: session.token,
                fileName: "gps-spoofing-report.csv",
                query: exportQuery
              });
            } catch (error) {
              setStatusMessage(error.message);
            } finally {
              setExporting("");
            }
          }}
          type="button"
        >
          <FileSpreadsheet size={16} />
          {exporting === "csv" ? "Exporting..." : "Export CSV"}
        </button>
        <button
          className="secondary-button"
          disabled={!session?.token || exporting === "pdf"}
          onClick={async () => {
            if (!session?.token) {
              setStatusMessage("Login is required to export secured reports.");
              return;
            }

            setExporting("pdf");
            setStatusMessage("");

            try {
              await apiDownload("/reports/export.pdf", {
                token: session.token,
                fileName: "gps-spoofing-report.pdf",
                query: exportQuery
              });
            } catch (error) {
              setStatusMessage(error.message);
            } finally {
              setExporting("");
            }
          }}
          type="button"
        >
          <FileText size={16} />
          {exporting === "pdf" ? "Exporting..." : "Export PDF"}
        </button>
        <Link href="/detections" className="secondary-button">
          <Radar size={16} />
          Detection
        </Link>
        <Link href="/settings" className="primary-button">
          <Settings2 size={16} />
          Settings
        </Link>
      </>
    ),
    [exportQuery, exporting, session?.token]
  );

  if (authLoading && loading && logs.length === 0 && alerts.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <AlertPopups alerts={popupAlerts} onDismiss={dismissPopup} />

      <SiteShell
        actions={actions}
        eyebrow="GPS Spoofing Detection System"
        loading={authLoading}
        onLogout={logout}
        session={session}
        subtitle="Track live telemetry, follow the focused device path, and review spoofing events through a denser monitoring console that matches the operational flow in your reference."
        title="Dashboard"
      >
        {statusMessage ? (
          <div className="monitor-panel mb-6 px-4 py-3 text-sm text-text-primary">
            {statusMessage}
          </div>
        ) : null}

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
          resultCount={pagination.total ?? alerts.length}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            hint="Distinct active assets represented in the live stream."
            icon={RadioTower}
            label="Active Devices"
            tone="signal"
            value={summary.assetCount}
          />
          <OverviewCard
            hint="Assets currently involved in spoofing detections."
            icon={ShieldCheck}
            label="Safe / Risk Split"
            tone="success"
            value={`${summary.normalPoints}/${summary.spoofedPoints}`}
          />
          <OverviewCard
            hint="Open or acknowledged spoofing incidents in view."
            icon={ShieldAlert}
            label="Total Alerts"
            tone="danger"
            value={summary.totalIncidents}
          />
          <OverviewCard
            hint="Unique devices appearing inside the current incident queue."
            icon={Waypoints}
            label="Suspicious Devices"
            tone="accent"
            value={suspiciousDevices}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.48fr_0.82fr]">
          <div className="space-y-6">
            <div className="monitor-panel p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Live GPS Map</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
                    Focused route visualization
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="monitor-badge">
                    Focus:{" "}
                    <span className="text-text-primary">
                      {focusDevice?.callsign ?? "Awaiting stream"}
                    </span>
                  </span>
                  <span className="monitor-badge">
                    Confidence:{" "}
                    <span className="text-text-primary">
                      {summary.averageConfidence.toFixed(0)}%
                    </span>
                  </span>
                </div>
              </div>
              <LiveMap focusDeviceId={focusDevice?.id} logs={logs} />
            </div>

            <div className="monitor-panel p-5">
              <LiveCharts
                chartSeries={chartSeries}
                focusDevice={focusDevice}
                loading={loading}
              />
            </div>

            <FocusTrackTable focusDevice={focusDevice} focusTrack={focusTrack} />
          </div>

          <div className="space-y-6">
            <OpsStatusPanel
              connected={connected}
              focusDevice={focusDevice}
              latestAlert={latestAlert}
              latestLog={latestLog}
              mode={mode}
              thresholds={thresholds}
            />

            <DeviceMonitor deviceSnapshots={deviceSnapshots} focusDevice={focusDevice} />

            <div className="monitor-panel p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Recent Alerts</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-wide">
                    Detection queue
                  </h3>
                </div>
                <Activity className="text-signal" size={18} />
              </div>
              <EventFeed alerts={alerts} loading={loading} />
            </div>

            <RuleMatrix alerts={alerts} />
          </div>
        </section>

        {!session?.token ? (
          <section className="mt-6">
            <EmptyState
              action={
                <Link href="/login" className="primary-button">
                  Secure login
                </Link>
              }
              description="Demo mode is active. Sign in to connect authenticated websocket alerts, admin controls, and secured report exports."
              title="Preview mode"
            />
          </section>
        ) : null}
      </SiteShell>
    </>
  );
}
