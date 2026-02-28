// src/FunctionBased/Components/LayoutSelector/LayoutSelector.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";
import Plot from "react-plotly.js";
import { Input } from "@nextui-org/react";

import { FONT_STACK, THEME_OVERRIDES, AXIS_THEME, LEGEND_THEME } from "../../../shared/plotlyTheme";

function LayoutSelector({ plotlyData }) {
  const [columns, setColumns] = useState(1);
  const [title, setTitle] = useState("");

  // Handler for columns input change
  const handleColumnsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setColumns(value);
    }
  };

  // Handler for title input
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  return (
    <div className="mt-8">
      {/* Title Input */}
      <div className="mb-6 flex justify-center items-center">
        <div className="w-full max-w-md mx-auto">
          <Input
            clearable
            bordered
            color="success"
            size="lg"
            label="Input Title"
            placeholder="Enter your desired title"
            value={title}
            onChange={handleTitleChange}
            css={{
              textAlign: "center",
              display: "grid",
              flexDirection: "row",
            }}
          />
        </div>
      </div>

      {/* Grid Layout for Plots — same structure as original */}
      <div className="mt-8 flex justify-center">
        <div
          className="grid w-full gap-8 place-items-center"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {plotlyData.map((figure, index) => (
            <div key={index} className="w-full max-w-full overflow-hidden">
              {(() => {
                const pieTraceCount = (figure.data || []).filter((trace) => trace?.type === "pie").length;
                const isSinglePieFigure = pieTraceCount === 1;

                const normalizedData = (figure.data || []).map((trace) => {
                  if (trace?.type !== "pie") return trace;

                  return {
                    ...trace,
                    // Keep labels readable and avoid clipping/overflow on narrow layouts.
                    textposition: "inside",
                    textfont: { ...(trace.textfont || {}), color: "#ffffff", size: 13 },
                    insidetextfont: { ...(trace.insidetextfont || {}), color: "#ffffff", size: 13 },
                    outsidetextfont: { ...(trace.outsidetextfont || {}), color: "#ffffff", size: 13 },
                    textinfo: trace.textinfo || "label+percent",
                    // Force full drawing area for single-pie figures to avoid tiny pies.
                    domain: isSinglePieFigure ? { x: [0, 1], y: [0, 1] } : trace.domain,
                    automargin: true,
                    marker: {
                      ...(trace.marker || {}),
                      colors: ["#2563eb", "#7c3aed", "#db2777", "#0f766e", "#c2410c"],
                      line: { color: "#ffffff", width: 2, ...(trace.marker?.line || {}) },
                    },
                  };
                });

                const { width: _w, height: _h, ...baseLayout } = figure.layout || {};

                return (
              <Plot
                key={index}
                data={normalizedData}
                layout={{
                  // Spread the backend layout first (keeps its width, height, margins, etc.)
                  ...baseLayout,
                  // Layer visual theme on top (fonts, colors, backgrounds)
                  ...THEME_OVERRIDES,
                  // Deep-merge axes — backend axis config + our visual styling
                  xaxis: { ...AXIS_THEME, ...figure.layout?.xaxis },
                  yaxis: { ...AXIS_THEME, ...figure.layout?.yaxis },
                  // Deep-merge other nested objects
                  font: { ...THEME_OVERRIDES.font, ...figure.layout?.font },
                  hoverlabel: { ...THEME_OVERRIDES.hoverlabel, ...figure.layout?.hoverlabel },
                  legend: { ...LEGEND_THEME, ...figure.layout?.legend },
                  // Title with modern font
                  title: {
                    text: title || (typeof figure.layout?.title === 'string'
                      ? figure.layout.title
                      : figure.layout?.title?.text || ''),
                    font: { family: FONT_STACK, size: 18, color: "#374151" },
                    x: 0.5,
                    xanchor: "center",
                    y: 0.96,
                    yanchor: "top",
                  },
                  showlegend: true,
                  legend: {
                    ...(LEGEND_THEME || {}),
                    ...(figure.layout?.legend || {}),
                    orientation: "h",
                    x: 0.5,
                    xanchor: "center",
                    y: -0.03,
                    yanchor: "top",
                    font: { color: "#1f2937", size: 14 },
                  },
                  autosize: true,
                  margin: {
                    t: 44,
                    r: 16,
                    b: 52,
                    l: 16,
                  },
                }}
                config={{
                  editable: true,
                  responsive: true,
                  displaylogo: false,
                  // Keep the default single camera button to avoid duplicate icons.
                  displayModeBar: "hover",
                }}
                useResizeHandler={true}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minHeight: isSinglePieFigure ? "460px" : "420px",
                  height: isSinglePieFigure ? "460px" : "420px",
                  overflow: "hidden",
                }}
              />
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

LayoutSelector.propTypes = {
  plotlyData: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default LayoutSelector;
