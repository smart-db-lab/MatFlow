import React, { useState } from "react";
import Plot from "react-plotly.js";
import EDAPlotSelector from "../../Components/EDAPlotSelector/EDAPlotSelector";
import BarPlot from "./BarPlot";
import PiePlot from "./PiePlot";
import Histogram from "./Histogram";
import BoxPlot from "./BoxPlot";
import ViolinPlot from "./ViolinPlot";
import ScatterPlot from "./ScatterPlot";
import RegPlot from "./RegPlot";
import LinePlot from "./LinePlot";
import CustomPlot from "./CustomPlot";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

function UnifiedEDA({ csvData }) {
    const [selectedPlotType, setSelectedPlotType] = useState("Bar Plot");
    const [echartsData, setEchartsData] = useState([]);
    const [plotlyData, setPlotlyData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePlotGenerated = (data) => {
        if (data && typeof data === "object" && data.engine === "plotly") {
            const nextPlotlyData = Array.isArray(data.data) ? data.data : [];
            setPlotlyData(nextPlotlyData);
            setEchartsData([]);
            return;
        }

        if (Array.isArray(data)) {
            setEchartsData(data);
            setPlotlyData([]);
        } else if (typeof data === "object") {
            setEchartsData([data]);
            setPlotlyData([]);
        } else {
            setEchartsData([]);
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
        setEchartsData([]);
        setPlotlyData([]);
        setError(null);
    };

    // Render plot component based on selected type
    const renderPlotComponent = () => {
        const commonProps = {
            csvData,
            splitMode: true,
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
            default:
                return <BarPlot {...commonProps} />;
        }
    };

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
                    <div className="py-1 bg-white p-3 rounded-md">{renderPlotComponent()}</div>
                </div>

                {/* Right Panel: Output/Plot */}
                <div className="flex-1 overflow-y-auto">
                    <div className="py-1 flex flex-col">
                        {loading && (
                            <div className="grid place-content-center min-h-[320px] w-full">
                                <div className="flex flex-col items-center gap-2">
                                    <CircularProgress size={36} sx={{ color: "#0D9488" }} />
                                    <p className="text-sm text-gray-600">Generating Plot...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <Alert severity="error">{error}</Alert>
                        )}

                        {!loading && !error && plotlyData.length > 0 && (
                            <div className="w-full">
                                <div className="grid grid-cols-1 gap-6">
                                    {plotlyData.map((figure, index) => (
                                        <Plot
                                            key={`unified-violin-plotly-${index}`}
                                            data={figure?.data || []}
                                            layout={{
                                                ...(figure?.layout || {}),
                                                autosize: true,
                                            }}
                                            config={{
                                                responsive: true,
                                                displaylogo: false,
                                                displayModeBar: "hover",
                                            }}
                                            useResizeHandler
                                            style={{
                                                width: "100%",
                                                minHeight: "420px",
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!loading &&
                            !error &&
                            plotlyData.length === 0 &&
                            echartsData.length > 0 && (
                                <div className="w-full">
                                    <LayoutSelector echartsData={echartsData} />
                                </div>
                            )}

                        {!loading &&
                            !error &&
                            echartsData.length === 0 &&
                            plotlyData.length === 0 && (
                                <div className="flex items-center justify-center min-h-[280px] w-full text-gray-500">
                                    <p className="text-base text-center px-4">
                                        Configure your plot settings and
                                        generate to see the visualization
                                    </p>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UnifiedEDA;
