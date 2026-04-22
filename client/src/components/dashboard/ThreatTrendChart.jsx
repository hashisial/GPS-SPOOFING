import { motion, useReducedMotion } from "framer-motion";

function buildLinePath(points, width, height, padding) {
  const max = Math.max(...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(points, width, height, padding) {
  const max = Math.max(...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const range = max - min || 1;

  const plottedPoints = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const first = plottedPoints[0];
  const last = plottedPoints[plottedPoints.length - 1];

  return [
    `M ${first.x} ${height - padding}`,
    ...plottedPoints.map((point) => `L ${point.x} ${point.y}`),
    `L ${last.x} ${height - padding}`,
    "Z"
  ].join(" ");
}

export function ThreatTrendChart({ points }) {
  const shouldReduceMotion = useReducedMotion();
  const width = 640;
  const height = 240;
  const padding = 24;
  const linePath = buildLinePath(points, width, height, padding);
  const areaPath = buildAreaPath(points, width, height, padding);
  const max = Math.max(...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const range = max - min || 1;

  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Risk Activity
          </p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            Daily threat pressure peaked at <span className="font-semibold">{max}</span> weighted incidents.
          </p>
        </div>
        <div className="rounded-full border border-[#1BC2D5]/20 bg-[#1BC2D5]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
          Live Trend
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full">
        <defs>
          <linearGradient id="threat-area" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1BC2D5" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#1BC2D5" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={height * ratio}
            x2={width - padding}
            y2={height * ratio}
            stroke="rgba(148,163,184,0.12)"
            strokeDasharray="6 6"
          />
        ))}

        <motion.path
          d={areaPath}
          fill="url(#threat-area)"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="#1BC2D5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0.45 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        {points.map((point, index) => {
          const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
          const y = height - padding - ((point.value - min) / range) * (height - padding * 2);

          return (
            <motion.g
              key={point.label}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : index * 0.035 }}
            >
              <circle cx={x} cy={y} r="4" fill="#000000" stroke="#1BC2D5" strokeWidth="2" />
              <text
                x={x}
                y={height - 6}
                textAnchor="middle"
                fill="rgba(226,232,240,0.72)"
                fontSize="11"
              >
                {point.label}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
