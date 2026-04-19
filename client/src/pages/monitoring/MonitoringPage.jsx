import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { PageIntro } from "../../components/common/PageIntro.jsx";
import { PanelCard } from "../../components/dashboard/PanelCard.jsx";
import { LiveMonitoringMap } from "../../components/maps/LiveMonitoringMap.jsx";
import { MonitoringSummaryCard } from "../../components/maps/MonitoringSummaryCard.jsx";
import { DeviceTelemetryList } from "../../components/maps/DeviceTelemetryList.jsx";
import { gpsService } from "../../services/gps/gps.service.js";
import { useSocket } from "../../hooks/useSocket.js";

const POLL_INTERVAL_MS = 60_000;

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load live monitoring data right now."
  );
}

export function MonitoringPage() {
  const { socket, isConnected } = useSocket();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [liveState, setLiveState] = useState({
    summary: {
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      activeMarkers: 0,
      latestTimestamp: null
    },
    devices: []
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
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

    async function loadLiveMonitoring() {
      try {
        const response = await gpsService.getLiveMonitoring({
          status: statusFilter,
          trailLimit: 14
        });

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setLiveState({
            summary: response.data.summary,
            devices: response.data.devices
          });

          setSelectedDeviceId((current) => {
            if (current && response.data.devices.some((device) => device.id === current)) {
              return current;
            }

            return response.data.devices[0]?.id ?? null;
          });
        });

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

    loadLiveMonitoring();
    const intervalId = window.setInterval(loadLiveMonitoring, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [refreshTick, statusFilter]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleMovement = () => {
      scheduleRealtimeRefresh();
    };

    socket.on("gps:movement", handleMovement);

    return () => {
      socket.off("gps:movement", handleMovement);
      window.clearTimeout(refreshTimerRef.current);
    };
  }, [socket]);

  const selectedDevice = useMemo(
    () => liveState.devices.find((device) => device.id === selectedDeviceId) ?? null,
    [liveState.devices, selectedDeviceId]
  );

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Live Operations"
        title="Live Monitoring"
        description="Track device movement in real time with position markers, route trails, popup telemetry, and online/offline fleet status."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MonitoringSummaryCard
          label="Total Devices"
          value={liveState.summary.totalDevices}
          detail="Devices included in the current live monitoring scope."
          tone="info"
        />
        <MonitoringSummaryCard
          label="Online Devices"
          value={liveState.summary.onlineDevices}
          detail="Devices still reporting within the live telemetry window."
          tone="success"
        />
        <MonitoringSummaryCard
          label="Offline Devices"
          value={liveState.summary.offlineDevices}
          detail="Assets not seen recently or outside the online threshold."
          tone="warning"
        />
        <MonitoringSummaryCard
          label="Map Markers"
          value={liveState.summary.activeMarkers}
          detail="Devices with a current position available for display."
          tone="info"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <PanelCard
          eyebrow="Geo Tracking"
          title="Live device positions and movement trails"
          description="The map refreshes on an interval and renders the latest route trail available for each monitored device."
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["ALL", "ONLINE", "OFFLINE"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusFilter(option)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    statusFilter === option
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              <span
                className={`rounded-full border px-3 py-1 ${
                  isConnected
                    ? "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]"
                    : "border-[#8B949E]/25 bg-[#8B949E]/10 text-[#C3CBD3]"
                }`}
              >
                {isConnected ? "Realtime Connected" : "Realtime Reconnecting"}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00FFC6]" />
                Online
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8B949E]" />
                Offline
              </span>
            </div>
          </div>

          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 px-4 py-3 text-sm text-[#FFB3B3]">
              {errorMessage}
            </div>
          ) : null}

          <LiveMonitoringMap
            devices={liveState.devices}
            selectedDeviceId={selectedDeviceId}
          />
        </PanelCard>

        <div className="space-y-4">
          <PanelCard
            eyebrow="Selected Device"
            title={selectedDevice?.deviceName ?? "No device selected"}
            description={
              selectedDevice
                ? `${selectedDevice.deviceId} - ${selectedDevice.isOnline ? "Online" : "Offline"}`
                : "Choose a device from the telemetry list to focus on its live route."
            }
          >
            {selectedDevice ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    Current Speed
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                    {selectedDevice.position ? `${selectedDevice.position.speed} km/h` : "N/A"}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    Route Samples
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                    {selectedDevice.trail?.length ?? 0}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4 sm:col-span-2 xl:col-span-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                        Heading
                      </div>
                      <div className="mt-1 font-medium text-[var(--text-primary)]">
                        {selectedDevice.position ? `${selectedDevice.position.heading} deg` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                        Accuracy
                      </div>
                      <div className="mt-1 font-medium text-[var(--text-primary)]">
                        {selectedDevice.position ? `${selectedDevice.position.accuracy} m` : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4 text-sm text-[var(--text-secondary)]">
                No live device is available for the current filter.
              </div>
            )}
          </PanelCard>

          <PanelCard
            eyebrow="Fleet Telemetry"
            title="Device list"
            description={
              isLoading
                ? "Loading live device telemetry..."
                : "Select a device to focus its route trail and status details. Live updates are applied through Socket.io."
            }
          >
            <DeviceTelemetryList
              devices={liveState.devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
            />
          </PanelCard>
        </div>
      </section>
    </div>
  );
}
