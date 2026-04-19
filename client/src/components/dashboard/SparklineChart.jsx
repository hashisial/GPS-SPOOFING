function buildSparklinePoints(values, width, height, padding) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export function SparklineChart({
  values,
  width = 140,
  height = 48,
  color = "var(--accent)"
}) {
  const polylinePoints = buildSparklinePoints(values, width, height, 6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />
    </svg>
  );
}
