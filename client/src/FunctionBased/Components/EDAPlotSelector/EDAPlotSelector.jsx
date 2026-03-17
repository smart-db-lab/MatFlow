import React from 'react';
import {
  BarChart3,
  PieChart,
  ChartColumnBig,
  Boxes,
  Activity,
  ScatterChart,
  TrendingUp,
  ChartLine,
  SlidersHorizontal,
  CircleDot,
} from 'lucide-react';

const PLOT_TYPES = [
  "Bar Plot",
  "Pie Plot",
  "Histogram",
  "Box Plot",
  "Violin Plot",
  "Scatter Plot",
  "Reg Plot",
  "Line Plot",
  "Custom Plot",
  "Venn Diagram"
];

const plotIcons = {
  "Bar Plot": BarChart3,
  "Pie Plot": PieChart,
  "Histogram": ChartColumnBig,
  "Box Plot": Boxes,
  "Violin Plot": Activity,
  "Scatter Plot": ScatterChart,
  "Reg Plot": TrendingUp,
  "Line Plot": ChartLine,
  "Custom Plot": SlidersHorizontal,
  "Venn Diagram": CircleDot,
};

function EDAPlotSelector({ selectedPlotType, onPlotTypeChange }) {
  return (
    <div className="w-full pt-3 mb-3 pb-2 border-b border-gray-200">
      <div className="flex flex-wrap gap-2">
        {PLOT_TYPES.map((plotType) => {
          const Icon = plotIcons[plotType];
          const isActive = selectedPlotType === plotType;
          return (
          <button
            key={plotType}
            onClick={() => onPlotTypeChange(plotType)}
            className={`h-9 px-3.5 rounded-lg text-sm font-medium leading-none transition-all duration-200 inline-flex items-center gap-1.5 ${
              isActive
                ? "bg-[#0D9488] text-white shadow-md"
                : "bg-white text-[#0D9488] border border-gray-300 hover:bg-[#0D9488]/10 hover:border-[#0D9488]"
            }`}
          >
            {Icon ? (
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                  isActive
                    ? "border-white/90 bg-white text-[#0D9488]"
                    : "border-[#0D9488]/20 bg-[#0D9488]/10 text-[#0D9488]"
                }`}
              >
                <Icon size={13} strokeWidth={2} />
              </span>
            ) : null}
            {plotType === "Reg Plot" ? "Regression Plot" : plotType}
          </button>
          );
        })}
      </div>
    </div>
  );
}

export default EDAPlotSelector;
