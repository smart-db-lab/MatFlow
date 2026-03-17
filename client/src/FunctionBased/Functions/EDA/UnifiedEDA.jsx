import React, { useState } from 'react';
import EDAPlotSelector from '../../Components/EDAPlotSelector/EDAPlotSelector';
import BarPlot from './BarPlot';
import PiePlot from './PiePlot';
import Histogram from './Histogram';
import BoxPlot from './BoxPlot';
import ViolinPlot from './ViolinPlot';
import ScatterPlot from './ScatterPlot';
import RegPlot from './RegPlot';
import LinePlot from './LinePlot';
import CustomPlot from './CustomPlot';
import VennDiagram from './VennDiagram';
import LayoutSelector from '../../Components/LayoutSelector/LayoutSelector';
import { Loading } from '@nextui-org/react';

function UnifiedEDA({ csvData }) {
  const [selectedPlotType, setSelectedPlotType] = useState("Bar Plot");
  const [plotlyData, setPlotlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlotGenerated = (data) => {
    if (Array.isArray(data)) {
      setPlotlyData(data);
    } else if (typeof data === "object") {
      setPlotlyData([data]);
    } else {
      setPlotlyData([]);
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleLoading = (isLoading) => {
    setLoading(isLoading);
  };

  // Reset plot data when plot type changes
  const handlePlotTypeChange = (plotType) => {
    setSelectedPlotType(plotType);
    setPlotlyData([]);
    setError(null);
  };

  // Render plot component based on selected type
  const renderPlotComponent = () => {
    const commonProps = {
      csvData,
      splitMode: selectedPlotType !== "Venn Diagram",
      onPlotGenerated: handlePlotGenerated,
      onError: handleError,
      onLoading: handleLoading,
    };

    switch (selectedPlotType) {
      case "Bar Plot":
        return <BarPlot {...commonProps} />;
      case "Pie Plot":
        return <PiePlot {...commonProps} />;
      case "Histogram":
        return <Histogram {...commonProps} />;
      case "Box Plot":
        return <BoxPlot {...commonProps} />;
      case "Violin Plot":
        return <ViolinPlot {...commonProps} />;
      case "Scatter Plot":
        return <ScatterPlot {...commonProps} />;
      case "Reg Plot":
        return <RegPlot {...commonProps} />;
      case "Line Plot":
        return <LinePlot {...commonProps} />;
      case "Custom Plot":
        return <CustomPlot {...commonProps} />;
      case "Venn Diagram":
        return <VennDiagram {...commonProps} />;
      default:
        return <BarPlot {...commonProps} />;
    }
  };

  // Venn Diagram uses top-down stacked layout
  if (selectedPlotType === "Venn Diagram") {
    return (
      <div className="w-full h-full">
        <EDAPlotSelector
          selectedPlotType={selectedPlotType}
          onPlotTypeChange={handlePlotTypeChange}
        />
        <div className="w-full">
          {/* Input controls on top */}
          <div className="w-full">
            {renderPlotComponent()}
          </div>
        </div>
      </div>
    );
  }

  // Other plots use side-by-side split layout
  return (
    <div className="w-full h-full flex flex-col">
      <EDAPlotSelector
        selectedPlotType={selectedPlotType}
        onPlotTypeChange={handlePlotTypeChange}
      />
      
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Left Panel: Input Controls */}
        <div className="w-[44%] min-w-[280px] max-w-[460px] overflow-y-auto pr-3 border-r border-gray-200">
          <div className="py-1">
            {renderPlotComponent()}
          </div>
        </div>

        {/* Right Panel: Output/Plot */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-1 flex flex-col items-center">
            {loading && (
              <div className="grid place-content-center min-h-[320px] w-full">
                <Loading color="primary" size="xl">
                  Generating Plot...
                </Loading>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-center">{error}</p>
              </div>
            )}

            {!loading && !error && plotlyData.length > 0 && (
              <div className="w-full flex justify-center">
                <LayoutSelector plotlyData={plotlyData} />
              </div>
            )}

            {!loading && !error && plotlyData.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-lg text-slate-500 space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Create a {selectedPlotType === "Reg Plot" ? "Regression Plot" : selectedPlotType}</h3>
                <div className="text-sm text-center px-4 space-y-3">
                  {selectedPlotType === "Bar Plot" && <p>Compare quantities across different categories. Select one or more <b>categorical variables</b> and exactly one <b>numerical variable</b>.</p>}
                  {selectedPlotType === "Pie Plot" && <p>Show proportions of a whole. Select exactly one <b>categorical variable</b> and one <b>numerical variable</b> to see the distribution.</p>}
                  {selectedPlotType === "Histogram" && <p>Visualize the distribution of continuous data. Select one or more <b>numerical variables</b> to see where values cluster and their overall spread.</p>}
                  {selectedPlotType === "Box Plot" && <p>Identify outliers and compare distributions. Select <b>numerical variables</b> to view their median, quartiles, and extremes.</p>}
                  {selectedPlotType === "Violin Plot" && <p>Similar to a box plot, but adds a kernel density estimation to show the full distribution shape. Select <b>numerical variables</b>.</p>}
                  {selectedPlotType === "Scatter Plot" && <p>Examine relationships between variables. Select horizontal and vertical <b>numerical axes</b> to spot correlations or clusters.</p>}
                  {selectedPlotType === "Reg Plot" && <p>Plot data points with a fitted linear regression line. Select exactly two <b>numerical variables</b> (X and Y).</p>}
                  {selectedPlotType === "Line Plot" && <p>Observe trends over time or continuous intervals. Select X and Y <b>numerical variables</b>.</p>}
                  {selectedPlotType === "Custom Plot" && <p>Build any plot combination using the advanced custom builder options.</p>}
                  {selectedPlotType === "Venn Diagram" && <p>Show logical relationships and overlaps between different structural sets or chemical groups.</p>}
                  <p className="mt-4 pt-4 border-t border-slate-100 text-slate-400">Configure your settings in the left panel and click <b>Generate</b> to visualize your data.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnifiedEDA;
