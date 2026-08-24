/** Recharts reads CSS vars at render time, so charts re-theme instantly. */
export const CHART_COLORS = {
  primary: "#4F46E5",
  secondary: "#8B5CF6",
  accent: "#14B8A6",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
} as const;

export const AXIS_PROPS = {
  tick: { fill: "var(--sub)", fontSize: 11 },
  axisLine: { stroke: "var(--line)" },
  tickLine: false as const,
};

export const GRID_STROKE = "var(--line)";

/** Standard recharts margin tuned for card layouts. */
export const CHART_MARGINS = { top: 8, right: 8, bottom: 0, left: 0 } as const;
