"use client";

import L from "leaflet";
import { Fragment, useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Pane,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";

const normalColor = "#4ade80";
const spoofColor = "#fb7185";
const focusColor = "#2dd4bf";

function toCoordinates(log) {
  return [log.latitude, log.longitude];
}

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function groupTracks(logs) {
  const grouped = new Map();

  [...logs]
    .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp))
    .forEach((log) => {
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

function resolveCenter(logs) {
  if (!logs.length) {
    return [33.6844, 73.0479];
  }

  return toCoordinates(logs[0]);
}

function FitToTelemetry({ logs, focusDeviceId }) {
  const map = useMap();

  useEffect(() => {
    const scopedLogs = focusDeviceId
      ? logs.filter((log) => log.deviceId === focusDeviceId)
      : logs;

    if (!scopedLogs.length) {
      return;
    }

    if (scopedLogs.length === 1) {
      map.setView(toCoordinates(scopedLogs[0]), 11, {
        animate: true
      });
      return;
    }

    const bounds = L.latLngBounds(scopedLogs.map((log) => toCoordinates(log)));

    map.fitBounds(bounds, {
      animate: true,
      maxZoom: 12,
      padding: [32, 32]
    });
  }, [focusDeviceId, logs, map]);

  return null;
}

function PathSegments({ points, isFocused }) {
  return points.slice(1).map((point, index) => {
    const previousPoint = points[index];
    const isSpoofedSegment = previousPoint.isSpoofed || point.isSpoofed;

    return (
      <Polyline
        key={`${previousPoint.id}-${point.id}`}
        pathOptions={{
          color: isSpoofedSegment ? spoofColor : normalColor,
          opacity: isFocused ? 0.95 : 0.6,
          weight: isFocused ? 5 : 3,
          dashArray: isSpoofedSegment ? "8 8" : undefined
        }}
        positions={[toCoordinates(previousPoint), toCoordinates(point)]}
      />
    );
  });
}

export default function LeafletMap({ logs, focusDeviceId }) {
  const center = resolveCenter(logs);
  const tracks = useMemo(() => groupTracks(logs), [logs]);

  if (!logs.length) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-[1.6rem] border border-dashed border-line/20 bg-surface/50 text-sm text-text-muted">
        Waiting for GPS telemetry and live alert markers.
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      className="h-[420px] w-full rounded-[1.6rem]"
      scrollWheelZoom={false}
      zoom={10}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <Pane name="tracks" style={{ zIndex: 410 }} />
      <Pane name="markers" style={{ zIndex: 450 }} />
      <FitToTelemetry focusDeviceId={focusDeviceId} logs={logs} />

      {tracks.map((track) => {
        const isFocused = track.deviceId === focusDeviceId;
        const latestPoint = track.points[track.points.length - 1];

        return (
          <Fragment key={track.deviceId}>
            <PathSegments isFocused={isFocused} points={track.points} />

            {track.points.map((point) => {
              const markerColor = point.isSpoofed ? spoofColor : normalColor;
              const isLatest = point.id === latestPoint.id;

              return (
                <Fragment key={point.id}>
                  {point.isSpoofed ? (
                    <CircleMarker
                      center={toCoordinates(point)}
                      pane="markers"
                      pathOptions={{
                        color: spoofColor,
                        fillColor: spoofColor,
                        fillOpacity: 0.08,
                        opacity: 0.22
                      }}
                      radius={isLatest ? 24 : 18}
                    />
                  ) : null}

                  <CircleMarker
                    center={toCoordinates(point)}
                    pane="markers"
                    pathOptions={{
                      color: isFocused && isLatest ? focusColor : markerColor,
                      fillColor: markerColor,
                      fillOpacity: 0.9,
                      opacity: 1,
                      weight: isLatest ? 3 : 2
                    }}
                    radius={isLatest ? 9 : 6}
                  >
                    {isLatest ? (
                      <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent>
                        {track.device?.callsign}
                      </Tooltip>
                    ) : null}

                    <Popup>
                      <strong>{track.device?.label ?? "Tracked device"}</strong>
                      <br />
                      Callsign: {track.device?.callsign}
                      <br />
                      State: {point.isSpoofed ? "Spoofed" : "Normal"}
                      <br />
                      Speed: {Math.round(point.speedKph ?? 0)} kph
                      <br />
                      Signal: {Math.round(point.signalStrength ?? 0)}
                      <br />
                      Confidence: {Math.round(point.alert?.confidence ?? point.spoofingScore ?? 0)}%
                      <br />
                      Time: {formatTimestamp(point.timestamp)}
                    </Popup>
                  </CircleMarker>
                </Fragment>
              );
            })}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
