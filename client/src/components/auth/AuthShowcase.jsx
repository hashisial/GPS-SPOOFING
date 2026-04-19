const threatHighlights = [
  {
    title: "Realtime Defense",
    description: "Stream secure GPS telemetry into a monitored control surface with rapid operator response."
  },
  {
    title: "Spoofing Intelligence",
    description: "Correlate impossible jumps, timestamp anomalies, and geofence breaches from one access point."
  },
  {
    title: "Operator Continuity",
    description: "Keep authenticated analysts moving with fast access to alerts, devices, reports, and response workflows."
  }
];

export function AuthShowcase() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(13,17,23,0.98),rgba(19,24,32,0.94))] p-8 shadow-2xl">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-12%] top-[-8%] h-56 w-56 rounded-full bg-[rgba(0,255,198,0.12)] blur-3xl" />
        <div className="absolute bottom-[-18%] right-[-8%] h-64 w-64 rounded-full bg-[rgba(255,59,59,0.08)] blur-3xl" />
        <div className="cyber-grid absolute inset-0" />
      </div>

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#00FFC6]">
          GPS Security Console
        </p>
        <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Secure access for spoofing detection operators
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Sign in to monitor live devices, investigate incident alerts, and generate security reports from a single cybersecurity-grade workspace.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="cyber-stat-card">
            <span className="cyber-stat-label">Latency</span>
            <strong className="cyber-stat-value">&lt; 2s</strong>
          </div>
          <div className="cyber-stat-card">
            <span className="cyber-stat-label">Coverage</span>
            <strong className="cyber-stat-value">24/7</strong>
          </div>
          <div className="cyber-stat-card">
            <span className="cyber-stat-label">Signal Integrity</span>
            <strong className="cyber-stat-value">AI Assisted</strong>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {threatHighlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#00FFC6]/14 bg-[#00FFC6]/5 px-4 py-4 backdrop-blur"
            >
              <h2 className="text-sm font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
