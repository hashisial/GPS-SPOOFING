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
import {
  AnimatedItem,
  AnimatedPage,
  SkeletonBlock,
  StaggeredSection
} from "../../components/animations/MotionPrimitives.jsx";
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
    { label: "Low", value: 100, color: "#1BC2D5" },
    { label: "Medium", value: 0, color: "#145052" },
    { label: "High", value: 0, color: "#1BC2D5" },
    { label: "Critical", value: 0, color: "#FFFFFF" }
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
    <AnimatedPage className="space-y-6">
      <PageIntro
        eyebrow="Operations"
        title={`Dashboard${user?.name ? `, ${user.name}` : ""}`}
        description="Top-level monitoring workspace for fleet health, spoofing activity, live alerts, and weighted system risk."
      />

      <AnimatedItem className="flex justify-end">
        <div
          className={`status-pill rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
            isConnected
              ? "border-[#1BC2D5]/20 bg-[#1BC2D5]/10 text-[var(--text-primary)]"
              : "border-[#145052]/25 bg-[#145052]/10 text-[var(--text-primary)]"
          }`}
        >
          {isConnected ? "Realtime Connected" : "Realtime Reconnecting"}
        </div>
      </AnimatedItem>

      <StaggeredSection className="dashboard-hero-grid grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <AnimatedItem className="dashboard-panel rounded-[2rem] p-6">
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
            <div className="rounded-[1.5rem] border border-[#1BC2D5]/20 bg-[#1BC2D5]/10 px-4 py-3 text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                Shift Posture
              </div>
              <div className="mt-1 text-3xl font-semibold text-[var(--text-primary)]">
                {overview.summary.overallRiskScore}/100
              </div>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem className="dashboard-panel rounded-[2rem] p-6">
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
        </AnimatedItem>
      </StaggeredSection>

      {errorMessage ? (
        <div className="rounded-[1.75rem] border border-[#FFFFFF]/35 bg-[#FFFFFF]/10 px-5 py-4 text-sm text-[var(--text-primary)]">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5">
          <div className="mb-4 text-sm text-[var(--text-secondary)]">
            Loading dashboard telemetry...
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonBlock key={item} className="h-32 rounded-[1.5rem]" />
            ))}
          </div>
        </div>
      ) : null}

      {!isLoading ? (
        <>
          <StaggeredSection className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" viewport>
            {overview.metrics.map((metric) => (
              <AnimatedItem key={metric.title}>
                <DashboardMetricCard {...metric} />
              </AnimatedItem>
            ))}
          </StaggeredSection>

          <StaggeredSection className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]" viewport>
            <AnimatedItem className="space-y-4">
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
            </AnimatedItem>

            <AnimatedItem>
              <LatestAlertsCard alerts={overview.latestAlerts} />
            </AnimatedItem>
          </StaggeredSection>

          <StaggeredSection className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]" viewport>
            <AnimatedItem>
              <SystemHealthCard
                items={overview.systemHealth}
                checklist={overview.responseChecklist}
              />
            </AnimatedItem>

            <AnimatedItem>
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
                  <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="ui-label text-xs uppercase leading-5 tracking-[0.18em] text-[var(--text-secondary)]">
                        Response Priority
                      </div>
                      <div className="balanced-copy mt-2 max-w-2xl text-lg font-semibold leading-8 text-[var(--text-primary)] sm:text-xl">
                        Critical spoofing incidents around secure perimeter corridors
                      </div>
                    </div>
                    <div className="ui-label inline-flex max-w-full items-center justify-center rounded-full border border-[#FFFFFF]/25 bg-[#FFFFFF]/10 px-4 py-2 text-center text-[0.68rem] font-semibold uppercase leading-5 tracking-[0.12em] text-[var(--text-primary)] sm:px-5 sm:text-xs xl:max-w-[17rem]">
                      Analyst Action Recommended
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20">
                    <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#1BC2D5,#FFFFFF)]" />
                  </div>
                </div>
                </div>
              </PanelCard>
            </AnimatedItem>
          </StaggeredSection>
        </>
      ) : null}
    </AnimatedPage>
  );
}
