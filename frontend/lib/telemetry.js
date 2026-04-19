const ACTIVE_ALERT_STATUSES = new Set(["OPEN", "ACKNOWLEDGED"]);

function toEpoch(value) {
  return new Date(value).getTime();
}

function shortTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function uniqueById(items, { limit = Infinity, dateField } = {}) {
  const map = new Map();

  items.filter(Boolean).forEach((item) => {
    map.set(item.id, item);
  });

  return [...map.values()]
    .sort((left, right) => toEpoch(right[dateField]) - toEpoch(left[dateField]))
    .slice(0, limit);
}

function normalizeSearch(value) {
  return value?.trim().toLowerCase() ?? "";
}

function includesSearch(values, search) {
  if (!search) {
    return true;
  }

  return values
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(search));
}

function sortAscendingByTimestamp(logs) {
  return [...logs].sort((left, right) => toEpoch(left.timestamp) - toEpoch(right.timestamp));
}

export function mergeGpsLogs(currentLogs, incomingLogs, limit = 180) {
  return uniqueById([...incomingLogs, ...currentLogs], {
    limit,
    dateField: "timestamp"
  });
}

export function mergeAlerts(currentAlerts, incomingAlerts, limit = 60) {
  return uniqueById([...incomingAlerts, ...currentAlerts], {
    limit,
    dateField: "detectedAt"
  });
}

export function attachAlertsToLogs(logs, alerts) {
  const alertsByLogId = new Map(
    alerts.filter(Boolean).map((alert) => [alert.gpsLogId, alert])
  );

  return logs.map((log) => {
    const linkedAlert = log.alert ?? alertsByLogId.get(log.id) ?? null;

    if (linkedAlert === log.alert) {
      return log;
    }

    return {
      ...log,
      alert: linkedAlert
    };
  });
}

export function attachAlertToMatchingLog(logs, alert) {
  return logs.map((log) =>
    log.id === alert.gpsLogId
      ? {
          ...log,
          alert
        }
      : log
  );
}

function matchesAlertFilters(alert, filters, search) {
  if (filters.severity && alert.severity !== filters.severity) {
    return false;
  }

  if (filters.status && alert.status !== filters.status) {
    return false;
  }

  return includesSearch(
    [
      alert.title,
      alert.description,
      alert.device?.label,
      alert.device?.callsign,
      ...(alert.triggeredRules ?? [])
    ],
    search
  );
}

function matchesLogSearch(log, search) {
  return includesSearch(
    [
      log.device?.label,
      log.device?.callsign,
      log.device?.fleet,
      ...(log.anomalyFlags ?? []),
      log.alert?.description
    ],
    search
  );
}

function latestLogPerDevice(logs) {
  const latest = new Map();

  logs.forEach((log) => {
    if (!latest.has(log.deviceId)) {
      latest.set(log.deviceId, log);
    }
  });

  return [...latest.values()];
}

function buildDeviceTracks(logs) {
  const grouped = new Map();

  sortAscendingByTimestamp(logs).forEach((log) => {
    const current = grouped.get(log.deviceId) ?? {
      deviceId: log.deviceId,
      device: log.device,
      points: []
    };

    current.points.push(log);
    current.device = log.device ?? current.device;
    grouped.set(log.deviceId, current);
  });

  return [...grouped.values()];
}

function buildChartSeries(logs) {
  const orderedLogs = sortAscendingByTimestamp(logs).slice(-18);

  return orderedLogs.map((log, index) => {
    const previous = orderedLogs[index - 1];
    const previousSignal = Number(previous?.signalStrength ?? log.signalStrength ?? 0);
    const currentSignal = Number(log.signalStrength ?? 0);

    return {
      id: log.id,
      label: shortTime(log.timestamp),
      timestamp: log.timestamp,
      speed: Number(log.speedKph ?? 0),
      signal: currentSignal,
      anomaly: Math.abs(currentSignal - previousSignal),
      confidence: Number(log.alert?.confidence ?? log.spoofingScore ?? 0),
      spoofed: log.isSpoofed
    };
  });
}

export function buildDashboardModel({ logs, alerts, filters = {} }) {
  const search = normalizeSearch(filters.search);
  const hasAlertFilters = Boolean(filters.severity || filters.status);
  const filteredAlerts = alerts.filter((alert) =>
    matchesAlertFilters(alert, filters, search)
  );

  let scopedLogs = logs;

  if (search || hasAlertFilters) {
    const visibleDeviceIds = new Set(filteredAlerts.map((alert) => alert.deviceId));

    if (search) {
      logs.forEach((log) => {
        if (matchesLogSearch(log, search)) {
          visibleDeviceIds.add(log.deviceId);
        }
      });
    }

    scopedLogs = logs.filter((log) => visibleDeviceIds.has(log.deviceId));
  }

  const deviceTracks = buildDeviceTracks(scopedLogs);
  const deviceSnapshots = latestLogPerDevice(scopedLogs);
  const focusDeviceId = filteredAlerts[0]?.deviceId ?? deviceSnapshots[0]?.deviceId ?? null;
  const focusTrack = deviceTracks.find((track) => track.deviceId === focusDeviceId);
  const chartSeries = buildChartSeries(focusTrack?.points ?? scopedLogs.slice(0, 18));
  const activeAlerts = filteredAlerts.filter((alert) =>
    ACTIVE_ALERT_STATUSES.has(alert.status)
  );
  const uniqueDevices = new Set(
    [...scopedLogs.map((log) => log.deviceId), ...filteredAlerts.map((alert) => alert.deviceId)].filter(
      Boolean
    )
  );
  const averageConfidenceSource = filteredAlerts.length
    ? filteredAlerts.map((alert) => Number(alert.confidence ?? 0))
    : scopedLogs.map((log) => Number(log.spoofingScore ?? 0));
  const averageConfidence = averageConfidenceSource.length
    ? averageConfidenceSource.reduce((sum, value) => sum + value, 0) /
      averageConfidenceSource.length
    : 0;

  return {
    alerts: filteredAlerts,
    logs: scopedLogs,
    latestAlert: filteredAlerts[0] ?? null,
    latestLog: scopedLogs[0] ?? null,
    deviceTracks,
    deviceSnapshots,
    focusDevice: focusTrack?.device ?? deviceSnapshots[0]?.device ?? null,
    focusTrack: focusTrack?.points ?? [],
    chartSeries,
    pagination: {
      total: filteredAlerts.length,
      page: 1,
      pageSize: filteredAlerts.length,
      totalPages: 1
    },
    summary: {
      totalIncidents: filteredAlerts.length,
      openIncidents: activeAlerts.length,
      criticalCount: filteredAlerts.filter((alert) => alert.severity === "CRITICAL").length,
      averageConfidence,
      assetCount: uniqueDevices.size,
      normalPoints: scopedLogs.filter((log) => !log.isSpoofed).length,
      spoofedPoints: scopedLogs.filter((log) => log.isSpoofed).length
    }
  };
}

let sharedAudioContext;

export function playSpoofingTone() {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  sharedAudioContext = sharedAudioContext ?? new AudioContextClass();

  const startPlayback = () => {
    const context = sharedAudioContext;
    const oscillator = context.createOscillator();
    const supportOscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(640, now + 0.28);

    supportOscillator.type = "sine";
    supportOscillator.frequency.setValueAtTime(440, now);
    supportOscillator.frequency.exponentialRampToValueAtTime(520, now + 0.28);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    oscillator.connect(gain);
    supportOscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    supportOscillator.start(now);
    oscillator.stop(now + 0.5);
    supportOscillator.stop(now + 0.5);
  };

  if (sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume().then(startPlayback).catch(() => {});
    return;
  }

  startPlayback();
}
