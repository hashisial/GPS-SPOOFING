"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-[1.6rem] border border-dashed border-white/10 bg-slate-950/60 text-sm text-slate-400">
      Loading map tiles...
    </div>
  )
});

export function LiveMap({ logs, focusDeviceId }) {
  return (
    <div className="relative">
      <LeafletMap logs={logs} focusDeviceId={focusDeviceId} />
      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] flex flex-wrap gap-2">
        <span className="chip bg-surface-strong/85 text-text-primary">
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
          Normal
        </span>
        <span className="chip bg-surface-strong/85 text-text-primary">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" />
          Spoofed
        </span>
        <span className="chip bg-surface-strong/85 text-text-primary">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          Focused asset
        </span>
      </div>
    </div>
  );
}
