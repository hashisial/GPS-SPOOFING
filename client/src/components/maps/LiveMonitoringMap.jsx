import { Fragment, useEffect, useMemo, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";

const DEFAULT_CENTER = [24.8607, 67.0011];

function formatTimestamp(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString();
}

function resolveMarkerStyle(device, isSelected) {
  const intensity = resolveSignalIntensity(device);

  if (intensity >= 70) {
    return {
      color: isSelected ? "#FFFFFF" : "#FFFFFF",
      fillColor: isSelected ? "#FFFFFF" : "#FFFFFF"
    };
  }

  if (device.isOnline) {
    return {
      color: isSelected ? "#FFFFFF" : "#1BC2D5",
      fillColor: isSelected ? "#FFFFFF" : "#1BC2D5"
    };
  }

  return {
    color: isSelected ? "#FFFFFF" : "#145052",
    fillColor: isSelected ? "#FFFFFF" : "#145052"
  };
}

function resolveSignalIntensity(device) {
  if (!device.position || !device.isOnline) {
    return 0;
  }

  const speed = Number(device.position.speed) || 0;
  const accuracy = Number(device.position.accuracy) || 0;
  const speedScore = Math.min(speed / 180, 1) * 58;
  const accuracyScore = Math.min(accuracy / 90, 1) * 42;

  return Math.min(100, Math.round(speedScore + accuracyScore));
}

function buildViewportSignature(devices, selectedDeviceId) {
  return devices
    .map((device) => {
      const latest = device.position;
      return latest
        ? `${device.id}:${latest.latitude}:${latest.longitude}:${latest.timestamp}:${selectedDeviceId}`
        : `${device.id}:empty:${selectedDeviceId}`;
    })
    .join("|");
}

function MapViewportController({ devices, selectedDeviceId }) {
  const map = useMap();
  const positionedDevices = devices.filter((device) => Boolean(device.position));
  const selectedDevice = positionedDevices.find((device) => device.id === selectedDeviceId);
  const lastViewportSignatureRef = useRef("");
  const viewportSignature = useMemo(
    () => buildViewportSignature(positionedDevices, selectedDeviceId),
    [positionedDevices, selectedDeviceId]
  );

  useEffect(() => {
    if (lastViewportSignatureRef.current === viewportSignature) {
      return;
    }

    lastViewportSignatureRef.current = viewportSignature;

    if (selectedDevice?.trail?.length) {
      const bounds = selectedDevice.trail.map((point) => [point.latitude, point.longitude]);
      map.flyToBounds(bounds, {
        padding: [40, 40],
        maxZoom: 14,
        duration: 0.85,
        easeLinearity: 0.25
      });
      return;
    }

    if (positionedDevices.length > 1) {
      const bounds = positionedDevices.map((device) => [
        device.position.latitude,
        device.position.longitude
      ]);
      map.flyToBounds(bounds, {
        padding: [40, 40],
        maxZoom: 12,
        duration: 0.85,
        easeLinearity: 0.25
      });
      return;
    }

    if (positionedDevices.length === 1) {
      map.flyTo(
        [positionedDevices[0].position.latitude, positionedDevices[0].position.longitude],
        13,
        {
          duration: 0.75,
          easeLinearity: 0.25
        }
      );
    }
  }, [map, positionedDevices, selectedDevice, viewportSignature]);

  return null;
}

export function LiveMonitoringMap({ devices, selectedDeviceId, className = "" }) {
  const positionedDevices = devices.filter((device) => Boolean(device.position));

  return (
    <div className={`overflow-hidden rounded-[1.75rem] border border-[var(--border)] ${className}`.trim()}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={10}
        scrollWheelZoom
        className="cyber-leaflet-map h-[22rem] w-full bg-[#000000] sm:h-[28rem] md:h-[34rem]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewportController devices={positionedDevices} selectedDeviceId={selectedDeviceId} />

        {positionedDevices.map((device) => {
          const isSelected = device.id === selectedDeviceId;
          const markerStyle = resolveMarkerStyle(device, isSelected);
          const signalIntensity = resolveSignalIntensity(device);
          const isHighIntensity = signalIntensity >= 70;

          return (
            <Fragment key={device.id}>
              {device.trail?.length > 1 ? (
                <Polyline
                  positions={device.trail.map((point) => [point.latitude, point.longitude])}
                  pathOptions={{
                    color: isHighIntensity ? "#FFFFFF" : isSelected ? "#1BC2D5" : "#FFFFFF",
                    weight: isSelected ? 5 : 3,
                    opacity: isSelected ? 0.92 : 0.38,
                    dashArray: isHighIntensity ? "7 8" : undefined,
                    lineCap: "round",
                    lineJoin: "round",
                    className: isSelected || isHighIntensity ? "route-flow" : undefined
                  }}
                />
              ) : null}

              {isHighIntensity ? (
                <CircleMarker
                  center={[device.position.latitude, device.position.longitude]}
                  radius={isSelected ? 26 : 21}
                  interactive={false}
                  pathOptions={{
                    color: "#FFFFFF",
                    fillColor: "#FFFFFF",
                    fillOpacity: 0.08,
                    opacity: 0.45,
                    weight: 1,
                    className: "map-pulse-ring"
                  }}
                />
              ) : null}

              <CircleMarker
                center={[device.position.latitude, device.position.longitude]}
                radius={isSelected ? 11 : 8}
                pathOptions={{
                  color: markerStyle.color,
                  fillColor: markerStyle.fillColor,
                  fillOpacity: device.isOnline ? 0.88 : 0.6,
                  weight: isSelected ? 3 : 2,
                  className: isSelected ? "map-marker-selected" : "map-marker"
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  opacity={0.96}
                  className="leaflet-cyber-tooltip"
                >
                  <div>
                    <div className="font-semibold">{device.deviceName}</div>
                    <div>Signal intensity: {signalIntensity}/100</div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="max-w-[70vw] space-y-2 text-sm text-[#000000] sm:min-w-[14rem]">
                    <div>
                      <div className="font-semibold">{device.deviceName}</div>
                      <div className="text-xs uppercase tracking-[0.12em] text-[#145052]">
                        {device.deviceId}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[#145052]">Status</div>
                        <div className="font-medium">{device.isOnline ? "Online" : "Offline"}</div>
                      </div>
                      <div>
                        <div className="text-[#145052]">Speed</div>
                        <div className="font-medium">{device.position.speed} km/h</div>
                      </div>
                      <div>
                        <div className="text-[#145052]">Heading</div>
                        <div className="font-medium">{device.position.heading} deg</div>
                      </div>
                      <div>
                        <div className="text-[#145052]">Accuracy</div>
                        <div className="font-medium">{device.position.accuracy} m</div>
                      </div>
                    </div>
                    <div className="text-xs text-[#145052]">
                      Visual intensity: {signalIntensity}/100
                    </div>
                    <div className="text-xs text-[#145052]">
                      Last sample: {formatTimestamp(device.position.timestamp)}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
