"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { mockAlerts, mockGpsLogs } from "@/lib/mock-data";
import {
  attachAlertToMatchingLog,
  attachAlertsToLogs,
  buildDashboardModel,
  mergeAlerts,
  mergeGpsLogs,
  playSpoofingTone
} from "@/lib/telemetry";
import { createSocket } from "@/lib/socket";

const initialDemoLogs = attachAlertsToLogs(mockGpsLogs, mockAlerts);

function enqueueUniqueAlert(currentAlerts, nextAlert) {
  const deduped = currentAlerts.filter((alert) => alert.id !== nextAlert.id);
  return [nextAlert, ...deduped].slice(0, 3);
}

export function useLiveDetections(token, filters = {}) {
  const [logs, setLogs] = useState(initialDemoLogs);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("demo");
  const [connected, setConnected] = useState(false);
  const [popupAlerts, setPopupAlerts] = useState([]);
  const popupTimersRef = useRef(new Map());
  const bootstrapCompleteRef = useRef(false);

  useEffect(() => {
    const popupTimers = popupTimersRef.current;

    return () => {
      popupTimers.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      popupTimers.clear();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let socket;

    function dismissPopup(alertId) {
      setPopupAlerts((current) => current.filter((alert) => alert.id !== alertId));
      const timeoutId = popupTimersRef.current.get(alertId);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
        popupTimersRef.current.delete(alertId);
      }
    }

    function surfaceIncomingAlert(incomingAlert, shouldNotify = true) {
      setAlerts((current) => mergeAlerts(current, [incomingAlert]));
      setLogs((current) => attachAlertToMatchingLog(current, incomingAlert));

      if (!shouldNotify) {
        return;
      }

      setPopupAlerts((current) => enqueueUniqueAlert(current, incomingAlert));
      playSpoofingTone();

      const existingTimer = popupTimersRef.current.get(incomingAlert.id);

      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const timeoutId = window.setTimeout(() => {
        dismissPopup(incomingAlert.id);
      }, 6500);

      popupTimersRef.current.set(incomingAlert.id, timeoutId);
    }

    async function loadLiveData() {
      if (!token) {
        if (!active) {
          return;
        }

        setLogs(initialDemoLogs);
        setAlerts(mockAlerts);
        setPopupAlerts([]);
        setLoading(false);
        setMode("demo");
        setConnected(false);
        bootstrapCompleteRef.current = true;
        return;
      }

      setLoading(true);

      try {
        const [liveResponse, historyResponse, alertResponse] = await Promise.all([
          apiRequest("/gps/live", {
            token,
            query: {
              limit: 72
            }
          }),
          apiRequest("/history", {
            token,
            query: {
              page: 1,
              pageSize: 160
            }
          }),
          apiRequest("/alerts", {
            token,
            query: {
              page: 1,
              pageSize: 60
            }
          })
        ]);

        if (!active) {
          return;
        }

        const mergedAlerts = mergeAlerts([], alertResponse.data ?? []);
        const mergedLogs = attachAlertsToLogs(
          mergeGpsLogs(
            [],
            [...(liveResponse.data ?? []), ...(historyResponse.data ?? [])]
          ),
          mergedAlerts
        );

        setLogs(mergedLogs);
        setAlerts(mergedAlerts);
        setPopupAlerts([]);
        setMode("live");
      } catch {
        if (!active) {
          return;
        }

        setLogs(initialDemoLogs);
        setAlerts(mockAlerts);
        setPopupAlerts([]);
        setMode("demo");
        setConnected(false);
      } finally {
        if (active) {
          setLoading(false);
          bootstrapCompleteRef.current = true;
        }
      }

      try {
        socket = createSocket(token);

        socket.on("connect", () => {
          if (active) {
            setConnected(true);
          }
        });

        socket.on("disconnect", () => {
          if (active) {
            setConnected(false);
          }
        });

        socket.on("gps:updated", (payload) => {
          if (!active || !payload?.gpsLog) {
            return;
          }

          setLogs((current) => mergeGpsLogs(current, [payload.gpsLog]));
        });

        socket.on("alert:created", (incomingAlert) => {
          if (!active || !incomingAlert) {
            return;
          }

          surfaceIncomingAlert(incomingAlert, bootstrapCompleteRef.current);
        });
      } catch {
        if (active) {
          setConnected(false);
        }
      }
    }

    loadLiveData();

    return () => {
      active = false;

      if (socket) {
        socket.disconnect();
      }
    };
  }, [token]);

  const dashboardState = useMemo(
    () =>
      buildDashboardModel({
        logs: attachAlertsToLogs(logs, alerts),
        alerts,
        filters
      }),
    [alerts, filters, logs]
  );

  return {
    ...dashboardState,
    loading,
    mode,
    connected,
    popupAlerts,
    dismissPopup(alertId) {
      setPopupAlerts((current) => current.filter((alert) => alert.id !== alertId));
      const timeoutId = popupTimersRef.current.get(alertId);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
        popupTimersRef.current.delete(alertId);
      }
    }
  };
}
