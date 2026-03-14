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
  "Custom Plot"
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
};

function EDAPlotSelector({ selectedPlotType, onPlotTypeChange }) {
  return (
    <div className="w-full pt-4 mb-4 pb-3 border-b border-gray-300">
      <div className="flex flex-wrap gap-2">
        {PLOT_TYPES.map((plotType) => {
          const Icon = plotIcons[plotType];
          const isActive = selectedPlotType === plotType;
          return (
          <button
            key={plotType}
            onClick={() => onPlotTypeChange(plotType)}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 inline-flex items-center gap-1.5 ${
              isActive
                ? "bg-[#0D9488] text-white shadow-md"
                : "bg-white text-[#0F766E] border border-gray-300 hover:bg-[#0D9488]/10 hover:border-[#0D9488]"
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
            {plotType}
          </button>
          );
        })}
      </div>
    </div>
  );
}

export default EDAPlotSelector;
