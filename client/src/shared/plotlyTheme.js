// Shared Plotly visual theme constants — aligned with Matflow design system (style.jsonc).

export const FONT_STACK =
  "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const MODERN_COLORWAY = [
  "#0D9488", // Primary teal
  "#5EEAD4", // Primary light
  "#10B981", // Accent green
  "#36a2eb", // Sky Blue
  "#ff6384", // Soft Pink
  "#ffce56", // Warm Yellow
  "#9966ff", // Soft Purple
  "#ff9f40", // Orange
  "#6ee7b7", // Mint Green
  "#f0abfc", // Lavender Pink
];

export const THEME_OVERRIDES = {
  font: {
    family: FONT_STACK,
    size: 13,
    color: "#4b5563",
  },
  plot_bgcolor: "#ffffff",
  paper_bgcolor: "#ffffff",
  colorway: MODERN_COLORWAY,
  hoverlabel: {
    bgcolor: "rgba(50,50,50,0.85)",
    font: { color: "#ffffff", size: 13, family: FONT_STACK },
    bordercolor: "rgba(0,0,0,0)",
  },
  hovermode: "closest",
};

export const AXIS_THEME = {
  gridcolor: "rgba(0,0,0,0.06)",
  gridwidth: 1,
  linecolor: "rgba(0,0,0,0.08)",
  linewidth: 1,
  tickfont: { size: 12, color: "#1f2937", family: FONT_STACK },
  title: { font: { size: 14, color: "#111827", family: FONT_STACK } },
  zeroline: false,
  showline: true,
};

export const LEGEND_THEME = {
  font: { size: 13, color: "#111827", family: FONT_STACK },
};

/**
 * Build a themed layout by merging THEME_OVERRIDES + AXIS_THEME + LEGEND_THEME
 * on top of a figure's existing layout. Does NOT touch width/height/margin.
 */
export function applyPlotlyTheme(figureLayout = {}, titleOverride) {
  const backendTitle =
    typeof figureLayout.title === "string"
      ? figureLayout.title
      : figureLayout.title?.text ?? "";

  const titleText = titleOverride || backendTitle;

  return {
    ...figureLayout,
    ...THEME_OVERRIDES,
    font: { ...THEME_OVERRIDES.font, ...figureLayout.font },
    xaxis: { ...AXIS_THEME, ...figureLayout.xaxis },
    yaxis: { ...AXIS_THEME, ...figureLayout.yaxis },
    hoverlabel: { ...THEME_OVERRIDES.hoverlabel, ...figureLayout.hoverlabel },
    legend: { ...LEGEND_THEME, ...figureLayout.legend },
    title: titleText
      ? {
          text: titleText,
          font: { family: FONT_STACK, size: 18, color: "#374151" },
          x: 0.5,
          xanchor: "center",
        }
      : figureLayout.title,
    showlegend: figureLayout.showlegend !== false,
    autosize: true,
  };
}
