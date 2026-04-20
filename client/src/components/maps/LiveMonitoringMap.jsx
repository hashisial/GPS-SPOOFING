import { Fragment, useEffect } from "react";
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, useMap } from "react-leaflet";

const DEFAULT_CENTER = [24.8607, 67.0011];

function formatTimestamp(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString();
}

function resolveMarkerStyle(device, isSelected) {
  if (device.isOnline) {
    return {
      color: isSelected ? "#7FFFE5" : "#00FFC6",
      fillColor: isSelected ? "#7FFFE5" : "#00FFC6"
    };
  }

  return {
    color: isSelected ? "#C3CBD3" : "#8B949E",
    fillColor: isSelected ? "#C3CBD3" : "#8B949E"
  };
}

function MapViewportController({ devices, selectedDeviceId }) {
  const map = useMap();
  const positionedDevices = devices.filter((device) => Boolean(device.position));
  const selectedDevice = positionedDevices.find((device) => device.id === selectedDeviceId);

  useEffect(() => {
    if (selectedDevice?.trail?.length) {
      const bounds = selectedDevice.trail.map((point) => [point.latitude, point.longitude]);
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 14
      });
      return;
    }

    if (positionedDevices.length > 1) {
      const bounds = positionedDevices.map((device) => [
        device.position.latitude,
        device.position.longitude
      ]);
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 12
      });
      return;
    }

    if (positionedDevices.length === 1) {
      map.setView(
        [positionedDevices[0].position.latitude, positionedDevices[0].position.longitude],
        13
      );
    }
  }, [map, positionedDevices, selectedDevice]);

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
        className="h-[22rem] w-full bg-slate-950 sm:h-[28rem] md:h-[34rem]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewportController devices={positionedDevices} selectedDeviceId={selectedDeviceId} />

        {positionedDevices.map((device) => {
          const isSelected = device.id === selectedDeviceId;
          const markerStyle = resolveMarkerStyle(device, isSelected);

          return (
            <Fragment key={device.id}>
              {device.trail?.length > 1 ? (
                <Polyline
                  positions={device.trail.map((point) => [point.latitude, point.longitude])}
                  pathOptions={{
                    color: isSelected ? "#00FFC6" : "#7FFFE5",
                    weight: isSelected ? 5 : 3,
                    opacity: isSelected ? 0.92 : 0.35
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
                  weight: isSelected ? 3 : 2
                }}
              >
                <Popup>
                  <div className="max-w-[70vw] space-y-2 text-sm text-slate-900 sm:min-w-[14rem]">
                    <div>
                      <div className="font-semibold">{device.deviceName}</div>
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        {device.deviceId}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Status</div>
                        <div className="font-medium">{device.isOnline ? "Online" : "Offline"}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Speed</div>
                        <div className="font-medium">{device.position.speed} km/h</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Heading</div>
                        <div className="font-medium">{device.position.heading} deg</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Accuracy</div>
                        <div className="font-medium">{device.position.accuracy} m</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
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
