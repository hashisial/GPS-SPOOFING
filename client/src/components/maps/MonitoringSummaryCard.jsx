export function MonitoringSummaryCard({ label, value, detail, tone = "info" }) {
  const toneClassMap = {
    info: "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]",
    success: "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#B8FFF0]",
    warning: "border-[#8B949E]/20 bg-[#8B949E]/10 text-[#C3CBD3]"
  };

  return (
    <article className="dashboard-panel rounded-[1.6rem] p-5">
      <div className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${toneClassMap[tone] ?? toneClassMap.info}`}>
        {label}
      </div>
      <div className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{detail}</div>
    </article>
  );
}
