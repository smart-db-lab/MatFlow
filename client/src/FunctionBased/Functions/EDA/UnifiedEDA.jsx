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
              <div className="flex items-center justify-center min-h-[280px] w-full text-gray-500">
                <p className="text-base text-center px-4">Configure your plot settings and generate to see the visualization</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnifiedEDA;
