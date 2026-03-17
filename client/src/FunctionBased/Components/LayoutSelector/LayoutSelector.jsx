// src/FunctionBased/Components/LayoutSelector/LayoutSelector.jsx

import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import Plot from "react-plotly.js";
import { Input } from "@nextui-org/react";

import { FONT_STACK, THEME_OVERRIDES, AXIS_THEME, LEGEND_THEME } from "../../../shared/plotlyTheme";

function LayoutSelector({ plotlyData }) {
  const [columns, setColumns] = useState(1);
  const [title, setTitle] = useState("");
  const plotRefs = useRef([]);

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

  const [aspectRatio, setAspectRatio] = useState('auto');
  const [downloadFormat, setDownloadFormat] = useState('png');

  const aspectRatios = {
    'auto': { name: 'Auto (Fit to screen)', width: null, height: null },
    '16:9': { name: 'Widescreen (16:9)', width: 1920, height: 1080 },
    '4:3': { name: 'Standard (4:3)', width: 1600, height: 1200 },
    '1:1': { name: 'Square (1:1)', width: 1080, height: 1080 },
  };

  const handleDownloadClick = async () => {
    try {
      const Plotly = await import('plotly.js-dist');
      if (plotRefs.current.length > 0 && plotRefs.current[0]) {
        Plotly.default.downloadImage(plotRefs.current[0], {
          format: downloadFormat,
          width: aspectRatios[aspectRatio].width || plotRefs.current[0].clientWidth,
          height: aspectRatios[aspectRatio].height || plotRefs.current[0].clientHeight,
          filename: title || 'matflow_visualization'
        });
      }
    } catch (err) {
      console.error("Download failed", err);
    }
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

      {/* Export Settings */}
      <div className="mb-6 flex flex-wrap justify-center items-end gap-4 max-w-3xl mx-auto p-4 bg-gray-50 border border-gray-100 rounded-xl">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Aspect Ratio</label>
          <select 
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
          >
            {Object.entries(aspectRatios).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Format</label>
          <select 
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value)}
          >
            <option value="png">PNG (High Quality)</option>
            <option value="jpeg">JPEG (Smaller Size)</option>
            <option value="svg">SVG (Vector - Editable)</option>
          </select>
        </div>
        <button 
          onClick={handleDownloadClick}
          className="ml-2 px-5 py-2 h-[38px] bg-[#0D9488] text-white hover:bg-[#0F766E] font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Visualization
        </button>
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
                ref={(el) => {
                  if (el && el.el) {
                    plotRefs.current[index] = el.el;
                  }
                }}
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
                  displayModeBar: "hover",
                  toImageButtonOptions: {
                    format: downloadFormat, // png, svg, jpeg
                    filename: title || 'matflow_visualization',
                    height: aspectRatios[aspectRatio].height || undefined,
                    width: aspectRatios[aspectRatio].width || undefined,
                    scale: 2 // High resolution output
                  }
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
