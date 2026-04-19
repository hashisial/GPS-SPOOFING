"use client";

export function ToggleSwitch({ checked, label, description, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-3xl border border-line/20 bg-surface/55 px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition ${
          checked ? "border-signal/40 bg-signal/25" : "border-line/20 bg-surface-strong/60"
        }`}
      >
        <input
          checked={checked}
          className="sr-only"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </label>
  );
}

