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

/** Gradient stop definitions for area fills — use with SVG <defs> linearGradient. */
export const GRADIENT_STOPS: Record<string, { stop1: string; stop2: string }> = {
  info: { stop1: "rgba(59,130,246,0.28)", stop2: "rgba(59,130,246,0.00)" },
  accent: { stop1: "rgba(20,184,166,0.22)", stop2: "rgba(20,184,166,0.00)" },
  sub: { stop1: "rgba(156,163,175,0.18)", stop2: "rgba(156,163,175,0.00)" },
  primary: { stop1: "rgba(79,70,229,0.28)", stop2: "rgba(79,70,229,0.00)" },
};

export const AXIS_PROPS = {
  tick: { fill: "var(--sub)", fontSize: 10.5 },
  axisLine: false as const,
  tickLine: false as const,
};

/** Subtle horizontal grid — just enough to guide the eye, no noise. */
export const GRID_STROKE = "var(--line)";
export const GRID_OPACITY = 0.55;

/** Standard recharts margin tuned for card layouts. */
export const CHART_MARGINS = { top: 8, right: 8, bottom: 0, left: 0 } as const;
