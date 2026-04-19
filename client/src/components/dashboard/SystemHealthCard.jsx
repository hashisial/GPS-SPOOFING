import { PanelCard } from "./PanelCard.jsx";

const toneClassMap = {
  success: "text-[#B8FFF0] border-[#00FFC6]/20 bg-[#00FFC6]/10",
  info: "text-[#9DFFEB] border-[#00FFC6]/16 bg-[#00FFC6]/8",
  warning: "text-[#8B949E] border-[#8B949E]/20 bg-[#8B949E]/10",
  danger: "text-[#FFD1D1] border-[#FF3B3B]/25 bg-[#FF3B3B]/12"
};

export function SystemHealthCard({ items, checklist }) {
  return (
    <PanelCard
      eyebrow="System Health"
      title="Operational integrity status"
      description="Key platform surfaces with capacity, stability, and response guidance for the current shift."
      className="h-full"
    >
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.label}
                </div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">{item.detail}</div>
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                  toneClassMap[item.tone] ?? toneClassMap.info
                }`}
              >
                {item.value}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#00FFC6,#8B949E)]"
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          Shift Checklist
        </p>
        <ul className="mt-3 space-y-3">
          {checklist.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </PanelCard>
  );
}
