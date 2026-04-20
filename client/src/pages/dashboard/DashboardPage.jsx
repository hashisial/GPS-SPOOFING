import { useEffect, useRef, useState } from "react";
import { PageIntro } from "../../components/common/PageIntro.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useSocket } from "../../hooks/useSocket.js";
import { DashboardMetricCard } from "../../components/dashboard/DashboardMetricCard.jsx";
import { RiskOverviewCard } from "../../components/dashboard/RiskOverviewCard.jsx";
import { ThreatTrendChart } from "../../components/dashboard/ThreatTrendChart.jsx";
import { LatestAlertsCard } from "../../components/dashboard/LatestAlertsCard.jsx";
import { SystemHealthCard } from "../../components/dashboard/SystemHealthCard.jsx";
import { PanelCard } from "../../components/dashboard/PanelCard.jsx";
import { dashboardService } from "../../services/dashboard/dashboard.service.js";

const emptyOverview = {
  summary: {
    totalDevices: 0,
    onlineDevices: 0,
    alertsToday: 0,
    criticalAlerts: 0,
    overallRiskScore: 0,
    riskDelta: "0%"
  },
  metrics: [],
  riskDistribution: [
    { label: "Low", value: 100, color: "#00FFC6" },
    { label: "Medium", value: 0, color: "#8B949E" },
    { label: "High", value: 0, color: "#FF7A7A" },
    { label: "Critical", value: 0, color: "#FF3B3B" }
  ],
  threatTrend: [
    { label: "00:00", value: 0 },
    { label: "03:00", value: 0 },
    { label: "06:00", value: 0 },
    { label: "09:00", value: 0 },
    { label: "12:00", value: 0 },
    { label: "15:00", value: 0 },
    { label: "18:00", value: 0 },
    { label: "21:00", value: 0 }
  ],
  latestAlerts: [],
  systemHealth: [],
  responseChecklist: []
};

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load dashboard data right now."
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [overview, setOverview] = useState(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const refreshTimerRef = useRef(null);

  function scheduleRealtimeRefresh() {
    window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      setRefreshTick((current) => current + 1);
    }, 450);
  }

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadOverview() {
      try {
        const response = await dashboardService.getOverview();

        if (!isMounted) {
          return;
        }

        setOverview(response.data.overview);
        setErrorMessage("");
      } catch (error) {
        if (isMounted) {
          setErrorMessage(extractErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleRealtimeRefresh = () => {
      scheduleRealtimeRefresh();
    };

    socket.on("dashboard:refresh", handleRealtimeRefresh);
    socket.on("alerts:created", handleRealtimeRefresh);
    socket.on("alerts:updated", handleRealtimeRefresh);

    return () => {
      socket.off("dashboard:refresh", handleRealtimeRefresh);
      socket.off("alerts:created", handleRealtimeRefresh);
      socket.off("alerts:updated", handleRealtimeRefresh);
      window.clearTimeout(refreshTimerRef.current);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Operations"
        title={`Dashboard${user?.name ? `, ${user.name}` : ""}`}
        description="Top-level monitoring workspace for fleet health, spoofing activity, live alerts, and weighted system risk."
      />

      <div className="flex justify-end">
        <div
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
            isConnected
              ? "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]"
              : "border-[#8B949E]/25 bg-[#8B949E]/10 text-[#C3CBD3]"
          }`}
        >
          {isConnected ? "Realtime Connected" : "Realtime Reconnecting"}
        </div>
      </div>

      <section className="dashboard-hero-grid grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="dashboard-panel rounded-[2rem] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Command Status
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                Fleet monitoring remains active across all protected zones
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Device uptime is stable, but spoofing indicators climbed during the current operational window. Critical incidents need accelerated triage.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#00FFC6]/20 bg-[#00FFC6]/10 px-4 py-3 text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9DFFEB]">
                Shift Posture
              </div>
              <div className="mt-1 text-3xl font-semibold text-white">
                {overview.summary.overallRiskScore}/100
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel rounded-[2rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            System Snapshot
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Online Ratio
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                {overview.summary.totalDevices > 0
                  ? Math.round((overview.summary.onlineDevices / overview.summary.totalDevices) * 100)
                  : 0}%
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Critical Queue
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                {overview.summary.criticalAlerts}
              </div>
            </div>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-[1.75rem] border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 px-5 py-4 text-sm text-[#FFB3B3]">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] px-5 py-10 text-sm text-[var(--text-secondary)]">
          Loading dashboard telemetry...
        </div>
      ) : null}

      {!isLoading ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview.metrics.map((metric) => (
              <DashboardMetricCard key={metric.title} {...metric} />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <RiskOverviewCard
                score={overview.summary.overallRiskScore}
                delta={overview.summary.riskDelta}
                distribution={overview.riskDistribution}
              />
              <PanelCard
                eyebrow="Threat Pattern"
                title="Alert pressure across the active cycle"
                description="Weighted threat activity derived from fleet incidents and prioritization scoring."
              >
                <ThreatTrendChart points={overview.threatTrend} />
              </PanelCard>
            </div>

            <LatestAlertsCard alerts={overview.latestAlerts} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <SystemHealthCard
              items={overview.systemHealth}
              checklist={overview.responseChecklist}
            />

            <PanelCard
              eyebrow="Health Matrix"
              title="System health and posture summary"
              description="Operational summary of platform resilience and current response focus."
              className="h-full"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                    Alert Containment
                  </div>
                  <div className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">
                    84%
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    Most incidents are contained inside the first analyst review cycle.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                    System Health
                  </div>
                  <div className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">
                    92%
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    Core monitoring services are stable with moderate alert pipeline pressure.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 sm:col-span-2">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                        Response Priority
                      </div>
                      <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                        Critical spoofing incidents around secure perimeter corridors
                      </div>
                    </div>
                    <div className="rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#FFB3B3]">
                      Analyst Action Recommended
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20">
                    <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#00FFC6,#FF3B3B)]" />
                  </div>
                </div>
              </div>
            </PanelCard>
          </section>
        </>
      ) : null}
    </div>
  );
}
