import { useEffect, useMemo, useRef, useState } from "react";
import { PageIntro } from "../../components/common/PageIntro.jsx";
import { PanelCard } from "../../components/dashboard/PanelCard.jsx";
import { AlertsFiltersBar } from "../../components/alerts/AlertsFiltersBar.jsx";
import { AlertsTable } from "../../components/alerts/AlertsTable.jsx";
import { AlertsPagination } from "../../components/alerts/AlertsPagination.jsx";
import { AlertDetailsModal } from "../../components/alerts/AlertDetailsModal.jsx";
import { alertService } from "../../services/alerts/alert.service.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useSocket } from "../../hooks/useSocket.js";
import { APP_ROLES } from "../../utils/constants/app.constants.js";

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to process the alert request right now."
  );
}

export function AlertsPage() {
  const { role } = useAuth();
  const { socket, isConnected } = useSocket();
  const canManageAlerts =
    role === APP_ROLES.SUPER_ADMIN || role === APP_ROLES.SECURITY_ANALYST;

  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    search: "",
    severity: "",
    status: ""
  });
  const [draftSearch, setDraftSearch] = useState("");
  const [alertsState, setAlertsState] = useState({
    data: [],
    pagination: {
      page: 1,
      limit: 8,
      total: 0,
      totalPages: 1
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [actionState, setActionState] = useState("");
  const [preferredAction, setPreferredAction] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [realtimeMessage, setRealtimeMessage] = useState("");
  const refreshTimerRef = useRef(null);

  function scheduleRealtimeRefresh() {
    window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      setRefreshTick((current) => current + 1);
    }, 350);
  }

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadAlerts() {
      try {
        const params = {
          page: filters.page,
          limit: filters.limit,
          sortBy: "triggeredAt",
          sortOrder: "desc"
        };

        if (filters.search) {
          params.search = filters.search;
        }

        if (filters.severity) {
          params.severity = filters.severity;
        }

        if (filters.status) {
          params.status = filters.status;
        }

        const response = await alertService.list(params);

        if (!isMounted) {
          return;
        }

        setAlertsState({
          data: response.data.data,
          pagination: response.data.pagination
        });
        setPageError("");
      } catch (error) {
        if (isMounted) {
          setPageError(extractErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAlerts();

    return () => {
      isMounted = false;
    };
  }, [filters, refreshTick]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleAlertCreated = (alert) => {
      setRealtimeMessage(`New live alert detected for ${alert.deviceId}.`);
      scheduleRealtimeRefresh();
    };

    const handleAlertUpdated = (alert) => {
      setRealtimeMessage(`Alert ${alert.id} was updated in real time.`);
      scheduleRealtimeRefresh();

      if (selectedAlertId === alert.id) {
        loadAlertDetails(alert.id);
      }
    };

    const handleAlertDeleted = (payload) => {
      setRealtimeMessage(`Alert ${payload.id} was removed.`);
      scheduleRealtimeRefresh();

      if (selectedAlertId === payload.id) {
        closeDetails();
      }
    };

    socket.on("alerts:created", handleAlertCreated);
    socket.on("alerts:updated", handleAlertUpdated);
    socket.on("alerts:deleted", handleAlertDeleted);

    return () => {
      socket.off("alerts:created", handleAlertCreated);
      socket.off("alerts:updated", handleAlertUpdated);
      socket.off("alerts:deleted", handleAlertDeleted);
      window.clearTimeout(refreshTimerRef.current);
    };
  }, [selectedAlertId, socket]);

  useEffect(() => {
    if (!realtimeMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setRealtimeMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [realtimeMessage]);

  async function loadAlertDetails(alertId) {
    setIsDetailsLoading(true);
    setDetailsError("");

    try {
      const response = await alertService.getById(alertId);
      setSelectedAlert(response.data.alert);
    } catch (error) {
      setDetailsError(extractErrorMessage(error));
    } finally {
      setIsDetailsLoading(false);
    }
  }

  function openDetails(alertId, nextPreferredAction = "") {
    setSelectedAlertId(alertId);
    setSelectedAlert(null);
    setPreferredAction(nextPreferredAction);
    loadAlertDetails(alertId);
  }

  function closeDetails() {
    setSelectedAlertId(null);
    setSelectedAlert(null);
    setDetailsError("");
    setPreferredAction("");
    setActionState("");
  }

  async function refreshCurrentPage() {
    setFilters((current) => ({
      ...current
    }));
  }

  async function handleResolve(note) {
    if (!selectedAlertId) {
      return false;
    }

    setActionState("resolve");

    try {
      await alertService.resolve(selectedAlertId, {
        note: note?.trim() || ""
      });
      await loadAlertDetails(selectedAlertId);
      await refreshCurrentPage();
      return true;
    } catch (error) {
      setDetailsError(extractErrorMessage(error));
      return false;
    } finally {
      setActionState("");
    }
  }

  async function handleFalsePositive(reason) {
    if (!selectedAlertId) {
      return false;
    }

    setActionState("falsePositive");

    try {
      await alertService.markFalsePositive(selectedAlertId, {
        reason: reason.trim()
      });
      await loadAlertDetails(selectedAlertId);
      await refreshCurrentPage();
      return true;
    } catch (error) {
      setDetailsError(extractErrorMessage(error));
      return false;
    } finally {
      setActionState("");
    }
  }

  const summary = useMemo(() => {
    const total = alertsState.pagination.total;
    const critical = alertsState.data.filter((alert) => alert.severity === "Critical").length;
    const open = alertsState.data.filter((alert) => alert.status === "OPEN").length;

    return { total, critical, open };
  }, [alertsState]);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Incident Queue"
        title="Alerts"
        description="Investigate spoofing alerts with severity filters, server-backed pagination, detailed evidence, and incident workflow actions."
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

      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Loaded Alerts
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.total}
          </div>
        </article>
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Open Alerts
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.open}
          </div>
        </article>
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Critical In View
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.critical}
          </div>
        </article>
      </section>

      <PanelCard
        eyebrow="Filters"
        title="Search and refine the incident queue"
        description="Use server-backed search, severity filters, and status filters to narrow the active alert set."
      >
        <AlertsFiltersBar
          filters={filters}
          draftSearch={draftSearch}
          onDraftSearchChange={setDraftSearch}
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({
              ...current,
              page: 1,
              search: draftSearch.trim()
            }));
          }}
          onFilterChange={(key, value) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              [key]: value
            }))
          }
          onReset={() => {
            setDraftSearch("");
            setFilters({
              page: 1,
              limit: 8,
              search: "",
              severity: "",
              status: ""
            });
          }}
        />
      </PanelCard>

      <PanelCard
        eyebrow="Alert Table"
        title="Spoofing incident queue"
        description="Review current alerts, open the details modal, and take workflow actions according to your role."
      >
        {pageError ? (
          <div className="mb-4 rounded-2xl border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 px-4 py-3 text-sm text-[#FFB3B3]">
            {pageError}
          </div>
        ) : null}

        {realtimeMessage ? (
          <div className="mb-4 rounded-2xl border border-[#00FFC6]/20 bg-[#00FFC6]/10 px-4 py-3 text-sm text-[#B8FFF0]">
            {realtimeMessage}
          </div>
        ) : null}

        <AlertsTable
          alerts={alertsState.data}
          isLoading={isLoading}
          canManageAlerts={canManageAlerts}
          onOpenDetails={openDetails}
          onPrepareAction={openDetails}
        />

        <div className="mt-5">
          <AlertsPagination
            pagination={alertsState.pagination}
            onPageChange={(page) =>
              setFilters((current) => ({
                ...current,
                page
              }))
            }
          />
        </div>
      </PanelCard>

      <AlertDetailsModal
        alert={selectedAlert}
        isOpen={Boolean(selectedAlertId)}
        isLoading={isDetailsLoading}
        errorMessage={detailsError}
        canManageAlerts={canManageAlerts}
        preferredAction={preferredAction}
        actionState={actionState}
        onClose={closeDetails}
        onResolve={handleResolve}
        onFalsePositive={handleFalsePositive}
      />
    </div>
  );
}
